package ca.bc.gov.nrs.hrs.dto.rept;

import java.util.List;
import java.util.Map;

/**
 * Lookup values needed when creating a new agreement. Contains the acquisition and disposition
 * agreement code lists so the frontend can populate the type/method dropdowns.
 */
public record ReptAgreementOptionsDto(
    List<CodeOption> acquisitionCodes,
    List<CodeOption> dispositionCodes) {

  public record CodeOption(String code, String label) {}

  public static ReptAgreementOptionsDto from(
      Map<String, String> acquisitionCodes,
      Map<String, String> dispositionCodes) {
    return new ReptAgreementOptionsDto(
        toCodeOptions(acquisitionCodes),
        toCodeOptions(dispositionCodes));
  }

  private static List<CodeOption> toCodeOptions(Map<String, String> map) {
    return map.entrySet().stream()
        .sorted(Map.Entry.comparingByValue())
        .map(e -> new CodeOption(e.getKey(), e.getValue()))
        .toList();
  }
}
