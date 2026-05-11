package ca.bc.gov.nrs.rept.service.rept;

import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyCreateRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyDetailDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyExpropriationDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyExpropriationUpsertRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyMilestoneDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyMilestoneUpdateRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyOptionsDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyRegistrationDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyRegistrationUpsertRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertySummaryDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyUpdateRequestDto;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyExpropriationRepository;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyExpropriationRepository.ExpropriationParams;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyExpropriationRepository.ExpropriationResult;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyRegistrationRepository;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyRegistrationRepository.RegistrationParams;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyRegistrationRepository.RegistrationResult;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyRepository;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyRepository.PropertyInsertParams;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyRepository.PropertyInsertResult;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyRepository.PropertyMilestoneParams;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyRepository.PropertyUpdateParams;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyRepository.PropertyUpdateResult;
import java.util.List;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("oracle")
public class ReptPropertyService {

  private final ReptPropertyRepository propertyRepository;
  private final ReptPropertyRegistrationRepository registrationRepository;
  private final ReptPropertyExpropriationRepository expropriationRepository;

  public ReptPropertyService(
      ReptPropertyRepository propertyRepository,
      ReptPropertyRegistrationRepository registrationRepository,
      ReptPropertyExpropriationRepository expropriationRepository) {
    this.propertyRepository = propertyRepository;
    this.registrationRepository = registrationRepository;
    this.expropriationRepository = expropriationRepository;
  }

  public List<ReptPropertySummaryDto> listProperties(Long projectId) {
    if (projectId == null || projectId < 1) {
      return List.of();
    }
    return propertyRepository.findPropertySummaries(projectId);
  }

  public Optional<ReptPropertyDetailDto> findPropertyDetail(Long projectId, Long propertyId) {
    if (!isValidIds(projectId, propertyId)) {
      return Optional.empty();
    }
    return propertyRepository.findPropertyDetail(projectId, propertyId);
  }

  public Optional<ReptPropertyMilestoneDto> findPropertyMilestones(Long projectId, Long propertyId) {
    if (!isValidIds(projectId, propertyId)) {
      return Optional.empty();
    }
    return propertyRepository.findPropertyMilestones(projectId, propertyId);
  }

  public Optional<ReptPropertyRegistrationDto> findPropertyRegistration(
      Long projectId, Long propertyId) {
    if (!isValidIds(projectId, propertyId)) {
      return Optional.empty();
    }
    return propertyRepository
        .findProjectIdForProperty(propertyId)
    .filter(projectId::equals)
    .map(
      ignored ->
        registrationRepository
          .findByPropertyId(propertyId)
          .orElseGet(
            () ->
              new ReptPropertyRegistrationDto(
                propertyId, null, null, null, null, null)));
  }

  public Optional<ReptPropertyExpropriationDto> findPropertyExpropriation(
      Long projectId, Long propertyId) {
    if (!isValidIds(projectId, propertyId)) {
      return Optional.empty();
    }
    return propertyRepository
        .findProjectIdForProperty(propertyId)
    .filter(projectId::equals)
    .map(
      ignored ->
        expropriationRepository
          .findByPropertyId(propertyId)
          .orElseGet(
            () ->
              new ReptPropertyExpropriationDto(
                propertyId, null, null, null, null, null)));
  }

  /**
   * Returns dropdown options for property forms.
   */
  public ReptPropertyOptionsDto getPropertyOptions() {
    return propertyRepository.getPropertyOptions();
  }

  /**
   * Creates a new property for the given project.
   */
  public PropertyInsertResult createProperty(ReptPropertyCreateRequestDto request, String userId) {
    if (request == null || request.projectId() == null) {
      throw new IllegalArgumentException("Project ID is required");
    }
    PropertyInsertParams params = new PropertyInsertParams(
        request.projectId(),
        request.titleNumber(),
        request.parcelIdentifier(),
        request.legalDescription(),
        request.parcelAddress(),
        request.city(),
        request.parcelArea(),
        request.projectArea(),
        request.assessedValue(),
        request.acquisitionCode(),
        request.landTitleOfficeCode(),
        request.electoralDistrictCode(),
        request.orgUnitNumber(),
        request.expropriationRecommended());
    return propertyRepository.insert(params, userId);
  }

  /**
   * Updates property details (Details tab).
   */
  public PropertyUpdateResult updatePropertyDetails(
      Long projectId, Long propertyId, ReptPropertyUpdateRequestDto request, String userId) {
    validateProjectProperty(projectId, propertyId);
    PropertyUpdateParams params = new PropertyUpdateParams(
        request.revisionCount(),
        request.titleNumber(),
        request.parcelIdentifier(),
        request.legalDescription(),
        request.parcelAddress(),
        request.city(),
        request.parcelArea(),
        request.projectArea(),
        request.assessedValue(),
        request.acquisitionCode(),
        request.landTitleOfficeCode(),
        request.electoralDistrictCode(),
        request.orgUnitNumber(),
        request.expropriationRecommended());
    return propertyRepository.updateDetails(propertyId, params, userId);
  }

  /**
   * Updates property milestones (Milestones tab).
   */
  public PropertyUpdateResult updatePropertyMilestones(
      Long projectId, Long propertyId, ReptPropertyMilestoneUpdateRequestDto request, String userId) {
    validateProjectProperty(projectId, propertyId);
    PropertyMilestoneParams params = new PropertyMilestoneParams(
        request.revisionCount(),
        request.ownerContactDate(),
        request.internalAppraisalDate(),
        request.roadValueRequestedDate(),
        request.roadValueReceivedDate(),
        request.fundingRequestedDate(),
        request.fundingApprovedDate(),
        request.surveyRequestedDate(),
        request.surveyReceivedDate(),
        request.assessmentComment(),
        request.feeAppraisalRequestedDate(),
        request.feeAppraisalReceivedDate(),
        request.offerDate(),
        request.negotiationComment(),
        request.offerAcceptedDate(),
        request.completionDate(),
        request.acquisitionComment(),
        request.expropriationRecommended());
    return propertyRepository.updateMilestones(propertyId, params, userId);
  }

  /**
   * Deletes a property.
   */
  public void deleteProperty(Long projectId, Long propertyId, Long revisionCount) {
    validateProjectProperty(projectId, propertyId);
    propertyRepository.delete(propertyId, revisionCount);
  }

  /**
   * Updates property registration (Registration tab).
   */
  public RegistrationResult updatePropertyRegistration(
      Long projectId, Long propertyId, ReptPropertyRegistrationUpsertRequestDto request, String userId) {
    validateProjectProperty(projectId, propertyId);
    RegistrationParams params = new RegistrationParams(
        request.revisionCount(),
        request.ltoPlanNumber(),
        request.ltoDocumentNumber(),
        request.surveyTubeNumber(),
        request.registrationDate());
    return registrationRepository.upsert(propertyId, params, userId);
  }

  /**
   * Updates property expropriation (Expropriation tab).
   */
  public ExpropriationResult updatePropertyExpropriation(
      Long projectId, Long propertyId, ReptPropertyExpropriationUpsertRequestDto request, String userId) {
    validateProjectProperty(projectId, propertyId);
    ExpropriationParams params = new ExpropriationParams(
        request.revisionCount(),
        request.executiveApprovalDate(),
        request.consensualServiceDate(),
        request.noticeAdvancePaymentDate(),
        request.vestingDate());
    return expropriationRepository.upsert(propertyId, params, userId);
  }

  private boolean isValidIds(Long projectId, Long propertyId) {
    return projectId != null && projectId > 0 && propertyId != null && propertyId > 0;
  }

  private void validateProjectProperty(Long projectId, Long propertyId) {
    if (!isValidIds(projectId, propertyId)) {
      throw new IllegalArgumentException("Invalid project or property ID");
    }
    Optional<Long> actualProjectId = propertyRepository.findProjectIdForProperty(propertyId);
    if (actualProjectId.isEmpty() || !actualProjectId.get().equals(projectId)) {
      throw new IllegalArgumentException("Property does not belong to project");
    }
  }
}
