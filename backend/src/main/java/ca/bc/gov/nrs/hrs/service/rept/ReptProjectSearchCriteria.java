package ca.bc.gov.nrs.hrs.service.rept;

import java.util.Optional;

/**
 * Sanitised search inputs for REPT project search stored procedure.
 */
public record ReptProjectSearchCriteria(
    String projectFilePrefix,
    Long projectNumber,
    String projectFileSuffix,
    String projectName,
    Long regionNumber,
    Long districtNumber,
    String projectManagerUserId,
    String projectStatusCode) {

  public static Builder builder() {
    return new Builder();
  }

  public static final class Builder {
    private String projectFilePrefix;
    private Long projectNumber;
    private String projectFileSuffix;
    private String projectName;
    private Long regionNumber;
    private Long districtNumber;
    private String projectManagerUserId;
    private String projectStatusCode;

    private Builder() {}

    public Builder projectFilePrefix(String value) {
      this.projectFilePrefix = normalize(value);
      return this;
    }

    public Builder projectNumber(String value) {
      this.projectNumber = parseLong(value);
      return this;
    }

    public Builder projectNumber(Long value) {
      this.projectNumber = value;
      return this;
    }

    public Builder projectFileSuffix(String value) {
      this.projectFileSuffix = normalize(value);
      return this;
    }

    public Builder projectName(String value) {
      this.projectName = normalize(value);
      return this;
    }

    public Builder regionNumber(String value) {
      this.regionNumber = parseLong(value);
      return this;
    }

    public Builder regionNumber(Long value) {
      this.regionNumber = value;
      return this;
    }

    public Builder districtNumber(String value) {
      this.districtNumber = parseLong(value);
      return this;
    }

    public Builder districtNumber(Long value) {
      this.districtNumber = value;
      return this;
    }

    public Builder projectManagerUserId(String value) {
      this.projectManagerUserId = normalize(value);
      return this;
    }

    public Builder projectStatusCode(String value) {
      this.projectStatusCode = normalize(value);
      return this;
    }

    public ReptProjectSearchCriteria build() {
      return new ReptProjectSearchCriteria(
          projectFilePrefix,
          projectNumber,
          projectFileSuffix,
          projectName,
          regionNumber,
          districtNumber,
          projectManagerUserId,
          projectStatusCode);
    }

    private static String normalize(String value) {
      if (value == null) {
        return null;
      }
      String trimmed = value.trim();
      return trimmed.isEmpty() ? null : trimmed;
    }

    private static Long parseLong(String value) {
      return Optional.ofNullable(normalize(value))
          .flatMap(v -> {
            try {
              return Optional.of(Long.valueOf(v));
            } catch (NumberFormatException ex) {
              return Optional.empty();
            }
          })
          .orElse(null);
    }
  }
}
