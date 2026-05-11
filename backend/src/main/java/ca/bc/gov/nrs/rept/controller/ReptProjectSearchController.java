package ca.bc.gov.nrs.rept.controller;

import ca.bc.gov.nrs.rept.dto.CodeNameDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptProjectSearchOptionsDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptProjectSearchResponseDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptProjectSearchResultDto;
import ca.bc.gov.nrs.rept.service.rept.ReptProjectSearchCriteria;
import ca.bc.gov.nrs.rept.service.rept.ReptProjectSearchService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rept/projects/search")
@Validated
public class ReptProjectSearchController {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReptProjectSearchController.class);

  private final ObjectProvider<ReptProjectSearchService> serviceProvider;

  public ReptProjectSearchController(ObjectProvider<ReptProjectSearchService> serviceProvider) {
    this.serviceProvider = serviceProvider;
  }

  @GetMapping("/options")
  public ResponseEntity<ReptProjectSearchOptionsDto> options() {
    ReptProjectSearchService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT project search service unavailable – returning empty options");
      return ResponseEntity.noContent().build();
    }

    ReptProjectSearchOptionsDto dto = service.loadOptions();
    return ResponseEntity.ok(dto);
  }

  @GetMapping
  public ResponseEntity<ReptProjectSearchResponseDto> search(
      @RequestParam(name = "projectFile", required = false) String projectFile,
      @RequestParam(name = "projectName", required = false) String projectName,
      @RequestParam(name = "region", required = false) String region,
      @RequestParam(name = "district", required = false) String district,
      @RequestParam(name = "projectManager", required = false) String projectManager,
      @RequestParam(name = "status", required = false) String status,
      @RequestParam(name = "filePrefix", required = false) String filePrefix,
      @RequestParam(name = "fileSuffix", required = false) String fileSuffix,
      @RequestParam(name = "page", defaultValue = "0") @PositiveOrZero Integer page,
      @RequestParam(name = "size", defaultValue = "50") @Min(1) @Max(100) Integer size) {

    ReptProjectSearchService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT project search service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    ReptProjectSearchCriteria baseCriteria = ReptProjectSearchCriteria.builder()
        .projectFilePrefix(filePrefix)
        .projectFileSuffix(fileSuffix)
        .projectName(projectName)
        .regionNumber(region)
        .districtNumber(district)
        .projectManagerUserId(projectManager)
        .projectStatusCode(status)
        .build();

    ReptProjectSearchCriteria criteriaWithFile = service.mergeWithProjectFile(baseCriteria, projectFile);

    List<ReptProjectSearchResultDto> results = service.search(criteriaWithFile);

    int fromIndex = Math.min(page * size, results.size());
    int toIndex = Math.min(fromIndex + size, results.size());
    List<ReptProjectSearchResultDto> paged = results.subList(fromIndex, toIndex);

    ReptProjectSearchResponseDto response =
        new ReptProjectSearchResponseDto(paged, results.size(), page, size);

    return ResponseEntity.ok(response);
  }

  @GetMapping("/file-suffixes")
  public ResponseEntity<List<CodeNameDto>> fileSuffixes(
      @RequestParam(name = "prefix") String prefix) {
    ReptProjectSearchService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT project search service unavailable – returning empty suffix list");
      return ResponseEntity.noContent().build();
    }

    List<CodeNameDto> suffixes = service.loadFileSuffixes(prefix);
    return ResponseEntity.ok(suffixes);
  }
}
