package ca.bc.gov.nrs.rept.service.rept;

import ca.bc.gov.nrs.rept.dto.CodeNameDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptContactAssociationDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptContactDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptContactPageDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptContactSearchResultDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptProjectContactOptionsDto;
import ca.bc.gov.nrs.rept.exception.UserNotFoundException;
import ca.bc.gov.nrs.rept.repository.rept.ProjectCreationException;
import ca.bc.gov.nrs.rept.repository.rept.ReptContactRepository;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyRepository;
import ca.bc.gov.nrs.rept.repository.rept.ReptContactRepository.ContactAssociationRecord;
import ca.bc.gov.nrs.rept.repository.rept.ReptContactRepository.ContactRecord;
import ca.bc.gov.nrs.rept.repository.rept.ReptContactRepository.PropertyInfo;
import ca.bc.gov.nrs.rept.security.LoggedUserHelper;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("oracle")
public class ReptContactService {

  private final ReptContactRepository contactRepository;
  private final ReptPropertyRepository propertyRepository;
  private final LoggedUserHelper loggedUserHelper;

  public ReptContactService(
      ReptContactRepository contactRepository,
      ReptPropertyRepository propertyRepository,
      LoggedUserHelper loggedUserHelper) {
    this.contactRepository = contactRepository;
    this.propertyRepository = propertyRepository;
    this.loggedUserHelper = loggedUserHelper;
  }

  public ReptContactPageDto findProjectContacts(Long projectId) {
    if (projectId == null || projectId < 1) {
      return new ReptContactPageDto(List.of(), 0);
    }

    List<ContactAssociationRecord> records = contactRepository.findContactsForProject(projectId);
    List<ReptContactAssociationDto> results =
        records.stream()
            .filter(record -> record.projectId() == null || Objects.equals(record.projectId(), projectId))
            .map(this::toAssociationDto)
            .toList();
    return new ReptContactPageDto(results, results.size());
  }

  public Optional<List<ReptContactDto>> findPropertyContacts(Long projectId, Long propertyId) {
    if (!isValidIds(projectId, propertyId)) {
      return Optional.empty();
    }

    Optional<Long> owningProject = propertyRepository.findProjectIdForProperty(propertyId);
    if (owningProject.isEmpty() || !Objects.equals(owningProject.get(), projectId)) {
      return Optional.empty();
    }

    List<ContactAssociationRecord> records = contactRepository.findContactsForProperty(propertyId);
    List<ReptContactDto> results =
        records.stream()
            .filter(record -> Objects.equals(record.propertyId(), propertyId))
            .map(this::toContactDto)
            .toList();
    return Optional.of(results);
  }

  private ReptContactAssociationDto toAssociationDto(ContactAssociationRecord record) {
    PropertyInfo property = record.propertyInfo();
    Long propertyId = property != null ? property.id() : record.propertyId();
    String parcelIdentifier = property != null ? property.parcelIdentifier() : null;
    String titleNumber = property != null ? property.titleNumber() : null;

    return new ReptContactAssociationDto(
        record.associationId(),
        record.associationType().name(),
        propertyId,
        parcelIdentifier,
        titleNumber,
        toContactDto(record));
  }

  private ReptContactDto toContactDto(ContactAssociationRecord record) {
    ContactRecord contact = record.contact();
    return new ReptContactDto(
        record.associationId(),
        contact.id(),
        record.contactTypeCode(),
        record.contactTypeLabel(),
        contact.displayName(),
        contact.firstName(),
        contact.lastName(),
        contact.companyName(),
        contact.phone(),
        contact.fax(),
        contact.email(),
        contact.address(),
        contact.city(),
        contact.provinceState(),
        contact.country(),
        contact.postalZipCode());
  }

  private boolean isValidIds(Long projectId, Long propertyId) {
    return projectId != null && projectId > 0 && propertyId != null && propertyId > 0;
  }

  public ReptProjectContactOptionsDto loadProjectContactOptions() {
    return new ReptProjectContactOptionsDto(
        toCodeList(contactRepository.listContactTypes()));
  }

  public List<ReptContactSearchResultDto> searchContacts(String firstName, String lastName, String companyName) {
    boolean hasFirstName = firstName != null && !firstName.isBlank();
    boolean hasLastName = lastName != null && !lastName.isBlank();
    boolean hasCompanyName = companyName != null && !companyName.isBlank();

    if (!hasFirstName && !hasLastName && !hasCompanyName) {
      return List.of();
    }

    return contactRepository.searchContacts(firstName, lastName, companyName).stream()
        .map(record -> new ReptContactSearchResultDto(
            record.id(),
            record.displayName(),
            record.firstName(),
            record.lastName(),
            record.companyName(),
            record.city(),
            record.phone(),
            record.email()))
        .collect(Collectors.toList());
  }

  public ReptContactPageDto addProjectContact(Long projectId, Long contactId, String contactTypeCode)
      throws ProjectCreationException {
    if (projectId == null || projectId < 1) {
      throw new IllegalArgumentException("projectId is required");
    }
    if (contactId == null || contactId < 1) {
      throw new IllegalArgumentException("contactId is required");
    }

    String currentUserId = resolveCurrentUserId();
    if (currentUserId == null || currentUserId.isBlank()) {
      throw new ProjectCreationException(
          ProjectCreationException.Reason.CHECK_CONSTRAINT,
          "Entry user ID is required to add a contact.");
    }

    contactRepository.addProjectContact(projectId, contactId, contactTypeCode, currentUserId);
    return findProjectContacts(projectId);
  }

  public ReptContactPageDto removeProjectContact(Long projectId, Long associationId)
      throws ProjectCreationException {
    if (projectId == null || projectId < 1) {
      throw new IllegalArgumentException("projectId is required");
    }
    if (associationId == null || associationId < 1) {
      throw new IllegalArgumentException("associationId is required");
    }

    // Get the revision count for optimistic locking
    List<ContactAssociationRecord> records = contactRepository.findContactsForProject(projectId);
    Optional<ContactAssociationRecord> target = records.stream()
        .filter(r -> Objects.equals(r.associationId(), associationId))
        .findFirst();

    if (target.isEmpty()) {
      throw new ProjectCreationException(
          ProjectCreationException.Reason.DATA_NOT_CURRENT,
          "Contact association not found.");
    }

    // For project contacts, we don't have revisionCount in the association record directly
    // Pass null to let the stored procedure handle it
    contactRepository.removeProjectContact(associationId, target.get().revisionCount());
    return findProjectContacts(projectId);
  }

  public Optional<List<ReptContactDto>> addPropertyContact(
      Long projectId, Long propertyId, Long contactId, String contactTypeCode)
      throws ProjectCreationException {
    if (!isValidIds(projectId, propertyId)) {
      throw new IllegalArgumentException("projectId and propertyId are required");
    }
    if (contactId == null || contactId < 1) {
      throw new IllegalArgumentException("contactId is required");
    }

    Optional<Long> owningProject = propertyRepository.findProjectIdForProperty(propertyId);
    if (owningProject.isEmpty() || !Objects.equals(owningProject.get(), projectId)) {
      throw new IllegalArgumentException("Property does not belong to the specified project.");
    }

    String currentUserId = resolveCurrentUserId();
    if (currentUserId == null || currentUserId.isBlank()) {
      throw new ProjectCreationException(
          ProjectCreationException.Reason.CHECK_CONSTRAINT,
          "Entry user ID is required to add a contact.");
    }

    contactRepository.addPropertyContact(propertyId, contactId, contactTypeCode, currentUserId);
    return findPropertyContacts(projectId, propertyId);
  }

  public Optional<List<ReptContactDto>> removePropertyContact(
      Long projectId, Long propertyId, Long associationId) throws ProjectCreationException {
    if (!isValidIds(projectId, propertyId)) {
      throw new IllegalArgumentException("projectId and propertyId are required");
    }
    if (associationId == null || associationId < 1) {
      throw new IllegalArgumentException("associationId is required");
    }

    Optional<Long> owningProject = propertyRepository.findProjectIdForProperty(propertyId);
    if (owningProject.isEmpty() || !Objects.equals(owningProject.get(), projectId)) {
      throw new IllegalArgumentException("Property does not belong to the specified project.");
    }

    // Look up revision count for optimistic locking
    List<ContactAssociationRecord> records = contactRepository.findContactsForProperty(propertyId);
    Optional<ContactAssociationRecord> target = records.stream()
        .filter(r -> Objects.equals(r.associationId(), associationId))
        .findFirst();

    if (target.isEmpty()) {
      throw new ProjectCreationException(
          ProjectCreationException.Reason.DATA_NOT_CURRENT,
          "Property contact association not found.");
    }

    contactRepository.removePropertyContact(associationId, target.get().revisionCount());
    return findPropertyContacts(projectId, propertyId);
  }

  private String resolveCurrentUserId() {
    try {
      return loggedUserHelper.getLoggedUserId();
    } catch (UserNotFoundException ex) {
      return "";
    }
  }

  private List<CodeNameDto> toCodeList(Map<String, String> source) {
    return source.entrySet().stream()
        .map(entry -> new CodeNameDto(entry.getKey(), entry.getValue()))
        .sorted(Comparator.comparing(CodeNameDto::name, Comparator.nullsLast(String::compareToIgnoreCase)))
        .collect(Collectors.toList());
  }
}
