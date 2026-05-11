package ca.bc.gov.nrs.hrs.dto.rept;

import java.util.List;
import java.util.Map;

/**
 * Options available when creating or editing a project property.
 * Contains lookup values for dropdowns in the property form.
 */
public record ReptPropertyOptionsDto(
    List<CodeOption> acquisitionTypes,
    List<CodeOption> landTitleOffices,
    List<CodeOption> electoralDistricts,
    List<OrgUnitOption> forestDistricts) {

  public record CodeOption(String code, String label) {}

  public record OrgUnitOption(Long orgUnitNo, String code, String name) {}

  public static ReptPropertyOptionsDto from(
      Map<String, String> acquisitionTypes,
      Map<String, String> landTitleOffices,
      Map<String, String> electoralDistricts,
      List<OrgUnitOption> forestDistricts) {
    return new ReptPropertyOptionsDto(
        toCodeOptions(acquisitionTypes),
        toCodeOptions(landTitleOffices),
        toCodeOptions(electoralDistricts),
        forestDistricts);
  }

  private static List<CodeOption> toCodeOptions(Map<String, String> map) {
    return map.entrySet().stream()
        .map(e -> new CodeOption(e.getKey(), e.getValue()))
        .toList();
  }
}
