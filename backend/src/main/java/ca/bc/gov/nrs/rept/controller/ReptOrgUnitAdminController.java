package ca.bc.gov.nrs.rept.controller;

import ca.bc.gov.nrs.rept.dto.rept.admin.ReptOrgUnitDto;
import ca.bc.gov.nrs.rept.service.rept.admin.ReptOrgUnitAdminService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rept/admin/org-units")
@Validated
public class ReptOrgUnitAdminController {

  private final ReptOrgUnitAdminService service;

  public ReptOrgUnitAdminController(ReptOrgUnitAdminService service) {
    this.service = service;
  }

  @GetMapping
  public List<ReptOrgUnitDto> search(@RequestParam(value = "q", required = false) String query) {
    return service.search(query);
  }

  @GetMapping("/{number}")
  public ResponseEntity<ReptOrgUnitDto> find(@PathVariable("number") Long number) {
    return service.find(number).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
  }
}
