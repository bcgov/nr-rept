package ca.bc.gov.nrs.rept.service.rept;

import ca.bc.gov.nrs.rept.dto.CodeNameDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementCreateRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementOptionsDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementPayeeCandidateDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementPaymentDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementPaymentOptionsDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementPaymentCreateRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementPaymentTaxRateDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementPropertyDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementPropertyUpdateRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementUpdateRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementUpdateRequestDto.AgreementType;
import ca.bc.gov.nrs.rept.repository.rept.ReptAgreementRepository.AgreementCreateCommand;
import ca.bc.gov.nrs.rept.repository.rept.ReptAgreementRepository.AgreementUpdateCommand;
import ca.bc.gov.nrs.rept.repository.rept.ReptAgreementRepository;
import ca.bc.gov.nrs.rept.repository.rept.ReptAgreementRepository.PropertyAssociationLink;
import ca.bc.gov.nrs.rept.repository.rept.ReptAgreementRepository.PaymentCreateCommand;
import ca.bc.gov.nrs.rept.repository.rept.ReptAgreementRepository.PaymentReferenceData;
import ca.bc.gov.nrs.rept.repository.rept.ReptContactRepository;
import ca.bc.gov.nrs.rept.repository.rept.ReptContactRepository.AssociationType;
import ca.bc.gov.nrs.rept.repository.rept.ReptContactRepository.ContactAssociationRecord;
import ca.bc.gov.nrs.rept.repository.rept.ReptContactRepository.ContactRecord;
import ca.bc.gov.nrs.rept.repository.rept.ReptContactRepository.PropertyInfo;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyRepository;
import ca.bc.gov.nrs.rept.security.LoggedUserHelper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("oracle")
public class ReptAgreementService {

  private final ReptAgreementRepository repository;
  private final ReptPropertyRepository propertyRepository;
  private final ReptContactRepository contactRepository;
  private final LoggedUserHelper loggedUserHelper;

  public ReptAgreementService(
      ReptAgreementRepository repository,
      ReptPropertyRepository propertyRepository,
      ReptContactRepository contactRepository,
      LoggedUserHelper loggedUserHelper) {
    this.repository = repository;
    this.propertyRepository = propertyRepository;
    this.contactRepository = contactRepository;
    this.loggedUserHelper = loggedUserHelper;
  }

  /**
   * Returns the acquisition and disposition code lists used in the Add Agreement form.
   */
  @Transactional(readOnly = true)
  public ReptAgreementOptionsDto getCreateOptions() {
    Map<String, String>[] codeLists = repository.loadAgreementCodeLists();
    return ReptAgreementOptionsDto.from(codeLists[0], codeLists[1]);
  }

  /**
   * Creates a new agreement on the given project and returns the persisted record.
   */
  @Transactional
  public ReptAgreementDto createAgreement(Long projectId, ReptAgreementCreateRequestDto request) {
    if (projectId == null || projectId < 1) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.VALIDATION,
          "Project identifier is required");
    }
    if (request == null) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.VALIDATION,
          "Request body is required");
    }

    String code = normalizeCode(request.agreementCode());
    if (code == null) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.VALIDATION,
          "Agreement code is required");
    }

    boolean acquisition = request.agreementType() == ReptAgreementCreateRequestDto.AgreementType.ACQUISITION;
    AgreementRuleContext context = new AgreementRuleContext(
        code,
        acquisition,
        request.agreementTerm(),
        request.bringForwardDate(),
        request.anniversaryDate(),
        request.renegotiationDate(),
        request.lessorsFile(),
        request.commitmentDescription(),
        request.coUserId());
    context.applyRules();

    if (!context.errors().isEmpty()) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.VALIDATION,
          "Agreement validation failed",
          context.errors());
    }

    String userId = safeUserId();
    AgreementCreateCommand command = new AgreementCreateCommand(
        projectId,
        Boolean.TRUE.equals(request.active()),
        trim(request.paymentTerms()),
        context.agreementTerm,
        request.expiryDate(),
        context.bringForwardDate,
        context.anniversaryDate,
        context.renegotiationDate,
        trim(context.lessorsFile),
        trim(context.commitmentDescription),
        context.coUserId,
        acquisition ? code : null,
        acquisition ? null : code,
        userId);

    Long newAgreementId;
    try {
      newAgreementId = repository.createAgreement(command);
    } catch (DataIntegrityViolationException ex) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.CONFLICT,
          "Unable to create agreement due to a data conflict",
          ex);
    } catch (DataAccessException ex) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.DATABASE_ERROR,
          "Unable to create agreement",
          ex);
    }

    if (newAgreementId == null) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.DATABASE_ERROR,
          "Agreement creation returned no ID");
    }

    return repository
        .findAgreement(projectId, newAgreementId)
        .orElseThrow(
            () ->
                new AgreementCommandException(
                    AgreementCommandException.Reason.NOT_FOUND,
                    "Agreement not found after creation"));
  }

  public List<ReptAgreementDto> listAgreements(Long projectId) {
    if (projectId == null || projectId < 1) {
      return List.of();
    }
    return repository.findAgreements(projectId);
  }

  public Optional<ReptAgreementDto> findAgreement(Long projectId, Long agreementId) {
    if (projectId == null || projectId < 1 || agreementId == null || agreementId < 1) {
      return Optional.empty();
    }
    return repository.findAgreement(projectId, agreementId);
  }

  public List<ReptAgreementPropertyDto> listAgreementProperties(Long projectId, Long agreementId) {
    if (!isAgreementInProject(projectId, agreementId)) {
      return List.of();
    }
    return repository.findAgreementProperties(projectId, agreementId);
  }

  public List<ReptAgreementPaymentDto> listAgreementPayments(Long projectId, Long agreementId) {
    if (!isAgreementInProject(projectId, agreementId)) {
      return List.of();
    }
    return repository.findAgreementPayments(projectId, agreementId);
  }

  public Optional<ReptAgreementPaymentOptionsDto> loadAgreementPaymentOptions(
      Long projectId, Long agreementId) {
    if (!isAgreementInProject(projectId, agreementId)) {
      return Optional.empty();
    }

    Map<Long, ReptAgreementPayeeCandidateDto> candidatesByContact =
        loadPayeeCandidates(projectId, agreementId);

    List<ReptAgreementPayeeCandidateDto> payeeCandidates =
        candidatesByContact.values().stream().sorted(payeeCandidateComparator()).toList();

    PaymentReferenceData referenceData = repository.loadPaymentReferenceData();
    Map<String, String> paymentTypeCodes =
        referenceData != null ? referenceData.paymentTypes() : Map.of();
    Map<String, String> paymentTermCodes =
        referenceData != null ? referenceData.paymentTerms() : Map.of();
    Map<String, String> expenseAuthorityCodes =
        referenceData != null ? referenceData.expenseAuthorities() : Map.of();
    Map<String, String> qualifiedReceiverCodes =
        referenceData != null ? referenceData.qualifiedReceivers() : Map.of();

    ReptAgreementPaymentOptionsDto options =
        new ReptAgreementPaymentOptionsDto(
            payeeCandidates,
            toCodeList(paymentTypeCodes),
            toCodeList(paymentTermCodes),
            toCodeList(expenseAuthorityCodes),
            toCodeList(qualifiedReceiverCodes),
            referenceData != null ? referenceData.taxRate() : null);

    return Optional.of(options);
  }

  @Transactional
  public ReptAgreementPaymentDto createAgreementPayment(
      Long projectId,
      Long agreementId,
      ReptAgreementPaymentCreateRequestDto request) {
    if (!isAgreementInProject(projectId, agreementId)) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.NOT_FOUND, "Agreement not found");
    }

    PaymentCreationContext context = sanitizePaymentRequest(projectId, agreementId, request);
    String userId = safeUserId();
    Long paymentId;

    try {
      paymentId =
          repository.createAgreementPayment(
              new PaymentCreateCommand(
                  agreementId,
                  context.requestDate(),
                  context.amount(),
                  context.paymentTermTypeCode(),
                  context.paymentTypeCode(),
                  context.processingInstructions(),
                  context.casClient(),
                  context.casResponsibilityCentre(),
                  context.casServiceLine(),
                  context.casStob(),
                  context.casProjectNumber(),
                  Boolean.FALSE,
                  context.gstAmount(),
                  context.totalAmount(),
                  context.taxRateId(),
                  context.expenseAuthorityCode(),
                  context.qualifiedReceiverCode(),
                  userId));
    } catch (DataIntegrityViolationException ex) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.CONFLICT,
          "Unable to create payment due to a data conflict",
          ex);
    } catch (DataAccessException ex) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.DATABASE_ERROR,
          "Unable to create payment",
          ex);
    }

    for (Long propertyContactId : context.payeePropertyContactIds()) {
      try {
        repository.addPayeeToPayment(paymentId, propertyContactId, userId);
      } catch (DataAccessException ex) {
        throw new AgreementCommandException(
            AgreementCommandException.Reason.DATABASE_ERROR,
            "Unable to associate payee " + propertyContactId + " to the payment",
            ex);
      }
    }

    return repository
        .findAgreementPayment(projectId, agreementId, paymentId)
        .orElseThrow(
            () ->
                new AgreementCommandException(
                    AgreementCommandException.Reason.NOT_FOUND,
                    "Payment not found after creation"));
  }

  public List<ReptAgreementPropertyDto> updateAgreementProperties(
      Long projectId,
      Long agreementId,
      ReptAgreementPropertyUpdateRequestDto request) {
    if (!isAgreementInProject(projectId, agreementId)) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.NOT_FOUND, "Agreement not found");
    }

    Set<Long> desiredPropertyIds =
        Optional.ofNullable(request)
            .map(ReptAgreementPropertyUpdateRequestDto::propertyIds)
            .orElse(List.of())
            .stream()
            .filter(Objects::nonNull)
            .collect(Collectors.toCollection(LinkedHashSet::new));

    List<String> validationErrors = new ArrayList<>();
    desiredPropertyIds.stream()
        .filter(id -> id == null || id < 1)
        .findFirst()
        .ifPresent(
            invalid -> validationErrors.add("Property identifiers must be positive values"));

    for (Long propertyId : desiredPropertyIds) {
      Optional<Long> ownerProjectId = propertyRepository.findProjectIdForProperty(propertyId);
      if (ownerProjectId.isEmpty()) {
        validationErrors.add("Property " + propertyId + " was not found");
      } else if (!Objects.equals(ownerProjectId.get(), projectId)) {
        validationErrors.add("Property " + propertyId + " does not belong to this project");
      }
    }

    if (!validationErrors.isEmpty()) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.VALIDATION,
          "Unable to update agreement properties",
          validationErrors);
    }

    List<PropertyAssociationLink> existingLinks = repository.findPropertyAssociationLinks(agreementId);
    Map<Long, PropertyAssociationLink> existingByProperty =
        existingLinks.stream()
            .collect(Collectors.toMap(PropertyAssociationLink::propertyId, link -> link, (left, right) -> left));

    String userId = safeUserId();

    for (Long propertyId : desiredPropertyIds) {
      if (!existingByProperty.containsKey(propertyId)) {
        try {
          repository.createPropertyAssociation(agreementId, propertyId, userId);
        } catch (DataAccessException ex) {
          throw new AgreementCommandException(
              AgreementCommandException.Reason.DATABASE_ERROR,
              "Unable to associate property " + propertyId + " to the agreement",
              ex);
        }
      }
    }

    for (PropertyAssociationLink link : existingLinks) {
      if (!desiredPropertyIds.contains(link.propertyId())) {
        try {
          repository.deletePropertyAssociation(link.associationId(), link.revisionCount());
        } catch (DataAccessException ex) {
          throw new AgreementCommandException(
              AgreementCommandException.Reason.DATABASE_ERROR,
              "Unable to remove property " + link.propertyId() + " from the agreement",
              ex);
        }
      }
    }

    return repository.findAgreementProperties(projectId, agreementId);
  }

  public ReptAgreementDto updateAgreement(
      Long projectId,
      Long agreementId,
      ReptAgreementUpdateRequestDto request) {
    if (projectId == null || projectId < 1 || agreementId == null || agreementId < 1) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.VALIDATION,
          "Project and agreement identifiers are required");
    }

    ReptAgreementDto current =
        repository
            .findAgreement(projectId, agreementId)
            .orElseThrow(
                () ->
                    new AgreementCommandException(
                        AgreementCommandException.Reason.NOT_FOUND,
                        "Agreement not found"));

    String userId = safeUserId();
    AgreementAdjustment adjustment = sanitize(request);

    AgreementUpdateCommand command =
        new AgreementUpdateCommand(
            agreementId,
            current.projectId(),
            request.revisionCount(),
            Boolean.TRUE.equals(request.active()),
            trim(request.paymentTerms()),
            adjustment.agreementTerm(),
            adjustment.expiryDate(),
            adjustment.bringForwardDate(),
            adjustment.anniversaryDate(),
            adjustment.renegotiationDate(),
            trim(adjustment.lessorsFile()),
            trim(adjustment.commitmentDescription()),
            adjustment.coUserId(),
            adjustment.acquisitionAgreementCode(),
            adjustment.dispositionAgreementCode(),
            userId);

    try {
      repository.updateAgreement(command);
    } catch (DataIntegrityViolationException ex) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.CONFLICT,
          "Agreement has been modified by another user",
          ex);
    } catch (DataAccessException ex) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.DATABASE_ERROR,
          "Unable to update agreement",
          ex);
    }

    return repository
        .findAgreement(projectId, agreementId)
        .orElseThrow(
            () ->
                new AgreementCommandException(
                    AgreementCommandException.Reason.NOT_FOUND,
                    "Agreement not found after update"));
  }

  private boolean isAgreementInProject(Long projectId, Long agreementId) {
    if (projectId == null || projectId < 1 || agreementId == null || agreementId < 1) {
      return false;
    }
    return repository.agreementBelongsToProject(projectId, agreementId);
  }

  private AgreementAdjustment sanitize(ReptAgreementUpdateRequestDto request) {
    if (request == null) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.VALIDATION, "Request body is required");
    }

    String code = normalizeCode(request.agreementCode());
    if (code == null) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.VALIDATION, "Agreement code is required");
    }

    boolean acquisition = request.agreementType() == AgreementType.ACQUISITION;
    AgreementRuleContext context = new AgreementRuleContext(request, code, acquisition);
    context.applyRules();

    if (!context.errors().isEmpty()) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.VALIDATION,
          "Agreement validation failed",
          context.errors());
    }

    return new AgreementAdjustment(
        acquisition ? code : null,
        acquisition ? null : code,
        context.agreementTerm,
        request.expiryDate(),
        context.bringForwardDate,
        context.anniversaryDate,
        context.renegotiationDate,
        context.lessorsFile,
        context.commitmentDescription,
        context.coUserId);
  }

  private String safeUserId() {
    try {
      return loggedUserHelper.getLoggedUserId();
    } catch (Exception ex) {
      return "UNKNOWN";
    }
  }

  private String normalizeCode(String value) {
    return value == null ? null : value.trim().toUpperCase();
  }

  private String trim(String value) {
    return StringUtils.isBlank(value) ? null : value.trim();
  }

  private List<CodeNameDto> toCodeList(Map<String, String> source) {
    if (source == null || source.isEmpty()) {
      return List.of();
    }
    return source.entrySet().stream()
        .map(entry -> new CodeNameDto(entry.getKey(), entry.getValue()))
        .sorted(
            Comparator.comparing(
                CodeNameDto::name, Comparator.nullsLast(String::compareToIgnoreCase)))
        .toList();
  }

  private ReptAgreementPayeeCandidateDto toPayeeCandidate(
      ContactAssociationRecord association, ReptAgreementPropertyDto property) {
    if (association == null) {
      return null;
    }

    ContactRecord contact = association.contact();
    if (contact == null) {
      return null;
    }

    Long propertyId = property != null ? property.propertyId() : association.propertyId();
    String parcelIdentifier = property != null ? property.parcelIdentifier() : extractParcelIdentifier(association);
    String titleNumber = property != null ? property.titleNumber() : extractTitleNumber(association);

    return new ReptAgreementPayeeCandidateDto(
        association.associationId(),
        propertyId,
        parcelIdentifier,
        titleNumber,
        contact.id(),
        association.contactTypeCode(),
        association.contactTypeLabel(),
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

  private String extractParcelIdentifier(ContactAssociationRecord association) {
    PropertyInfo info = association.propertyInfo();
    return info != null ? info.parcelIdentifier() : null;
  }

  private String extractTitleNumber(ContactAssociationRecord association) {
    PropertyInfo info = association.propertyInfo();
    return info != null ? info.titleNumber() : null;
  }

  private Comparator<ReptAgreementPayeeCandidateDto> payeeCandidateComparator() {
    return Comparator.comparing(
            ReptAgreementPayeeCandidateDto::parcelIdentifier,
            Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
        .thenComparing(
            ReptAgreementPayeeCandidateDto::displayName,
            Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
  }

  private Map<Long, ReptAgreementPayeeCandidateDto> loadPayeeCandidates(
      Long projectId, Long agreementId) {
    Map<Long, ReptAgreementPropertyDto> propertiesById =
        repository.findAgreementProperties(projectId, agreementId).stream()
            .collect(
                Collectors.toMap(
                    ReptAgreementPropertyDto::propertyId,
                    Function.identity(),
                    (left, right) -> left,
                    LinkedHashMap::new));

    Map<Long, ReptAgreementPayeeCandidateDto> candidates = new LinkedHashMap<>();
    for (ReptAgreementPropertyDto property : propertiesById.values()) {
      List<ContactAssociationRecord> associations =
          contactRepository.findContactsForProperty(property.propertyId());
      for (ContactAssociationRecord association : associations) {
        if (association == null
            || association.associationType() != AssociationType.PROPERTY
            || !Objects.equals(association.propertyId(), property.propertyId())) {
          continue;
        }
        ReptAgreementPayeeCandidateDto candidate = toPayeeCandidate(association, property);
        if (candidate != null && candidate.propertyContactId() != null) {
          candidates.put(candidate.propertyContactId(), candidate);
        }
      }
    }
    return candidates;
  }

  private PaymentCreationContext sanitizePaymentRequest(
      Long projectId,
      Long agreementId,
      ReptAgreementPaymentCreateRequestDto request) {
    if (request == null) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.VALIDATION, "Request body is required");
    }

    List<String> errors = new ArrayList<>();
    LocalDate requestDate = request.requestDate();
    if (requestDate == null) {
      errors.add("Payment request date is required");
    }

    BigDecimal amount = normalizeCurrency(request.amount());
    if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
      errors.add("Payment amount must be greater than zero");
    }

    // Optional fields based on legacy system - these can be null
    String paymentTypeCode = trim(request.paymentTypeCode());
    String paymentTermTypeCode = trim(request.paymentTermTypeCode());
    String expenseAuthorityCode = trim(request.expenseAuthorityCode());
    String qualifiedReceiverCode = trim(request.qualifiedReceiverCode());
    String casClient = trim(request.casClient());
    String casResponsibilityCentre = trim(request.casResponsibilityCentre());
    String casServiceLine = trim(request.casServiceLine());
    String casStob = trim(request.casStob());
    String casProjectNumber = trim(request.casProjectNumber());

    String processingInstructions = trim(request.processingInstructions());

    Map<Long, ReptAgreementPayeeCandidateDto> candidates =
        loadPayeeCandidates(projectId, agreementId);
    LinkedHashSet<Long> distinctPayees = new LinkedHashSet<>();
    if (request.propertyContactIds() != null) {
      for (Long payeeId : request.propertyContactIds()) {
        if (payeeId != null) {
          distinctPayees.add(payeeId);
        }
      }
    }

    if (distinctPayees.isEmpty()) {
      errors.add("At least one payee must be selected");
    } else if (distinctPayees.stream().anyMatch(id -> !candidates.containsKey(id))) {
      errors.add("Selected payees are invalid for this agreement");
    }

    boolean applyGst = Boolean.TRUE.equals(request.applyGst());
    BigDecimal gstAmount = BigDecimal.ZERO;
    BigDecimal totalAmount = amount;
    Long taxRateId = null;

    if (applyGst) {
      PaymentReferenceData referenceData = repository.loadPaymentReferenceData();
      ReptAgreementPaymentTaxRateDto taxRate = referenceData != null ? referenceData.taxRate() : null;
      if (taxRate == null || taxRate.id() == null || taxRate.percent() == null) {
        errors.add("GST cannot be applied because the current tax rate is unavailable");
      } else if (amount != null) {
        gstAmount = calculateGst(amount, taxRate.percent());
        totalAmount = amount.add(gstAmount);
        taxRateId = taxRate.id();
      }
    }

    if (!errors.isEmpty()) {
      throw new AgreementCommandException(
          AgreementCommandException.Reason.VALIDATION,
          "Unable to create payment",
          errors);
    }

    return new PaymentCreationContext(
        requestDate,
        amount,
        gstAmount,
        totalAmount,
        taxRateId,
        paymentTermTypeCode,
        paymentTypeCode,
        expenseAuthorityCode,
        qualifiedReceiverCode,
        casClient,
        casResponsibilityCentre,
        casServiceLine,
        casStob,
        casProjectNumber,
        processingInstructions,
        List.copyOf(distinctPayees));
  }

  private BigDecimal normalizeCurrency(BigDecimal value) {
    if (value == null) {
      return null;
    }
    return value.setScale(2, RoundingMode.HALF_UP);
  }

  private BigDecimal calculateGst(BigDecimal amount, BigDecimal percent) {
    if (amount == null || percent == null) {
      return BigDecimal.ZERO;
    }
    return amount.multiply(percent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
  }

  private static final class AgreementRuleContext {
    private final String code;
    private final boolean acquisition;
    private final List<String> errors = new java.util.ArrayList<>();
    private Long agreementTerm;
    private LocalDate bringForwardDate;
    private LocalDate anniversaryDate;
    private LocalDate renegotiationDate;
    private String lessorsFile;
    private String commitmentDescription;
    private Long coUserId;

    AgreementRuleContext(ReptAgreementUpdateRequestDto request, String code, boolean acquisition) {
      this.code = code;
      this.acquisition = acquisition;
      this.agreementTerm = request.agreementTerm();
      this.bringForwardDate = request.bringForwardDate();
      this.anniversaryDate = request.anniversaryDate();
      this.renegotiationDate = request.renegotiationDate();
      this.lessorsFile = request.lessorsFile();
      this.commitmentDescription = request.commitmentDescription();
      this.coUserId = request.coUserId();
    }

    /** Constructor used by the create-agreement flow (no update DTO exists yet). */
    AgreementRuleContext(
        String code,
        boolean acquisition,
        Long agreementTerm,
        LocalDate bringForwardDate,
        LocalDate anniversaryDate,
        LocalDate renegotiationDate,
        String lessorsFile,
        String commitmentDescription,
        Long coUserId) {
      this.code = code;
      this.acquisition = acquisition;
      this.agreementTerm = agreementTerm;
      this.bringForwardDate = bringForwardDate;
      this.anniversaryDate = anniversaryDate;
      this.renegotiationDate = renegotiationDate;
      this.lessorsFile = lessorsFile;
      this.commitmentDescription = commitmentDescription;
      this.coUserId = coUserId;
    }

    void applyRules() {
      if (acquisition) {
        applyAcquisitionRules();
      } else {
        applyDispositionRules();
      }
    }

    private void applyAcquisitionRules() {
      switch (code) {
        case "COM" -> {
          requireCommitmentDescription();
          clearTermAndDates();
          lessorsFile = null;
          coUserId = null;
        }
        case "LEA" -> {
          commitmentDescription = null;
          requireAgreementTerm();
          requireAnniversaryDate();
          requireBringForwardDate();
          requireRenegotiationDate();
          coUserId = null;
        }
        case "LOO", "ROW", "SLS" -> {
          commitmentDescription = null;
          requireAgreementTerm();
          requireAnniversaryDate();
          requireBringForwardDate();
          requireRenegotiationDate();
          lessorsFile = null;
          coUserId = null;
        }
        case "PUR" -> {
          commitmentDescription = null;
          clearTermAndDates();
          lessorsFile = null;
          coUserId = null;
        }
        default -> commitmentDescription = null;
      }
    }

    private void applyDispositionRules() {
      switch (code) {
        case "COM" -> {
          requireCommitmentDescription();
          clearTermAndDates();
          lessorsFile = null;
          coUserId = null;
        }
        case "COU" -> {
          commitmentDescription = null;
          requireAgreementTerm();
          requireAnniversaryDate();
          requireBringForwardDate();
          renegotiationDate = null;
          lessorsFile = null;
          if (coUserId == null) {
            errors.add("Co-User is required");
          }
        }
        default -> commitmentDescription = null;
      }
    }

    private void clearTermAndDates() {
      agreementTerm = null;
      bringForwardDate = null;
      anniversaryDate = null;
      renegotiationDate = null;
    }

    private void requireCommitmentDescription() {
      if (StringUtils.isBlank(commitmentDescription)) {
        errors.add("Commitment Description is required");
      }
    }

    private void requireAgreementTerm() {
      if (agreementTerm == null) {
        errors.add("Agreement Term is required");
      }
    }

    private void requireAnniversaryDate() {
      if (anniversaryDate == null) {
        errors.add("Anniversary Date is required");
      }
    }

    private void requireBringForwardDate() {
      if (bringForwardDate == null) {
        errors.add("PC Date is required");
      }
    }

    private void requireRenegotiationDate() {
      if (renegotiationDate == null) {
        errors.add("Negotiate Date is required");
      }
    }

    List<String> errors() {
      return errors;
    }
  }

  private record AgreementAdjustment(
      String acquisitionAgreementCode,
      String dispositionAgreementCode,
      Long agreementTerm,
      LocalDate expiryDate,
      LocalDate bringForwardDate,
      LocalDate anniversaryDate,
      LocalDate renegotiationDate,
      String lessorsFile,
      String commitmentDescription,
      Long coUserId) {}

  private record PaymentCreationContext(
      LocalDate requestDate,
      BigDecimal amount,
      BigDecimal gstAmount,
      BigDecimal totalAmount,
      Long taxRateId,
      String paymentTermTypeCode,
      String paymentTypeCode,
      String expenseAuthorityCode,
      String qualifiedReceiverCode,
      String casClient,
      String casResponsibilityCentre,
      String casServiceLine,
      String casStob,
      String casProjectNumber,
      String processingInstructions,
      List<Long> payeePropertyContactIds) {}
}
