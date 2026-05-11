package ca.bc.gov.nrs.rept.controller;

import ca.bc.gov.nrs.rept.dto.rept.admin.ReptRequestingSourceDto;
import ca.bc.gov.nrs.rept.dto.rept.admin.ReptRequestingSourceSearchCriteria;
import ca.bc.gov.nrs.rept.dto.rept.admin.ReptRequestingSourceUpsertRequestDto;
import ca.bc.gov.nrs.rept.service.rept.admin.ReptRequestingSourceAdminService;
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
@RequestMapping("/api/rept/admin/requesting-sources")
@Validated
public class ReptRequestingSourceAdminController {

  private final ReptRequestingSourceAdminService service;

  public ReptRequestingSourceAdminController(ReptRequestingSourceAdminService service) {
    this.service = service;
  }

  @GetMapping
  public List<ReptRequestingSourceDto> search(
      @RequestParam(value = "q", required = false) String query,
      @RequestParam(value = "external", required = false) Boolean external) {
    return service.search(new ReptRequestingSourceSearchCriteria(query, external));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ReptRequestingSourceDto> find(@PathVariable("id") Long id) {
    return service.find(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PostMapping
  public ResponseEntity<ReptRequestingSourceDto> create(
      @Valid @RequestBody ReptRequestingSourceUpsertRequestDto request) {
    ReptRequestingSourceDto dto = service.create(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(dto);
  }

  @PutMapping("/{id}")
  public ResponseEntity<ReptRequestingSourceDto> update(
      @PathVariable("id") Long id,
      @Valid @RequestBody ReptRequestingSourceUpsertRequestDto request) {
    ReptRequestingSourceDto dto = service.update(id, request);
    return ResponseEntity.ok(dto);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @PathVariable("id") Long id, @RequestParam("revision") Long revision) {
    service.delete(id, revision);
    return ResponseEntity.noContent().build();
  }
}
