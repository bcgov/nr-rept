package ca.bc.gov.nrs.hrs.controller;

import ca.bc.gov.nrs.hrs.dto.rept.ReptUserSearchResponseDto;
import ca.bc.gov.nrs.hrs.service.rept.ReptUserDirectoryService;
import ca.bc.gov.nrs.hrs.service.rept.ReptUserSearchCriteria;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rept/users")
@Validated
public class ReptUserController {

  private final ReptUserDirectoryService userDirectoryService;

  public ReptUserController(ReptUserDirectoryService userDirectoryService) {
    this.userDirectoryService = userDirectoryService;
  }

  @GetMapping("/search")
  public ResponseEntity<ReptUserSearchResponseDto> searchUsers(
      @RequestParam(name = "userId", required = false) String userId,
      @RequestParam(name = "firstName", required = false) String firstName,
      @RequestParam(name = "lastName", required = false) String lastName,
      @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
      @RequestParam(name = "size", defaultValue = "0") @Min(0) @Max(100) int size
  ) {
    ReptUserSearchCriteria criteria = new ReptUserSearchCriteria(userId, firstName, lastName, page, size);
    ReptUserSearchResponseDto response = userDirectoryService.searchUsers(criteria);
    return ResponseEntity.ok(response);
  }
}
