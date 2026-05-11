package ca.bc.gov.nrs.hrs.controller;

import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptExpenseAuthorityDto;
import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptExpenseAuthoritySearchCriteria;
import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptExpenseAuthorityUpsertRequestDto;
import ca.bc.gov.nrs.hrs.service.rept.admin.ReptExpenseAuthorityAdminService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rept/admin/expense-authorities")
@Validated
public class ReptExpenseAuthorityAdminController {

  private final ReptExpenseAuthorityAdminService service;

  public ReptExpenseAuthorityAdminController(ReptExpenseAuthorityAdminService service) {
    this.service = service;
  }

  @GetMapping
  public List<ReptExpenseAuthorityDto> search(
      @RequestParam(value = "q", required = false) String query,
      @RequestParam(value = "active", required = false) Boolean active) {
    return service.search(new ReptExpenseAuthoritySearchCriteria(query, active));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ReptExpenseAuthorityDto> find(@PathVariable("id") Long id) {
    return service.find(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PostMapping
  public ResponseEntity<ReptExpenseAuthorityDto> create(
      @Valid @RequestBody ReptExpenseAuthorityUpsertRequestDto request) {
    ReptExpenseAuthorityDto dto = service.create(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(dto);
  }

  @PutMapping("/{id}")
  public ResponseEntity<ReptExpenseAuthorityDto> update(
      @PathVariable("id") Long id,
      @Valid @RequestBody ReptExpenseAuthorityUpsertRequestDto request) {
    ReptExpenseAuthorityDto dto = service.update(id, request);
    return ResponseEntity.ok(dto);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
  }
}
