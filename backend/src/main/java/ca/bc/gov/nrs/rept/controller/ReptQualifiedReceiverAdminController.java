package ca.bc.gov.nrs.rept.controller;

import ca.bc.gov.nrs.rept.dto.rept.admin.ReptQualifiedReceiverDto;
import ca.bc.gov.nrs.rept.dto.rept.admin.ReptQualifiedReceiverSearchCriteria;
import ca.bc.gov.nrs.rept.dto.rept.admin.ReptQualifiedReceiverUpsertRequestDto;
import ca.bc.gov.nrs.rept.service.rept.admin.ReptQualifiedReceiverService;
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
@RequestMapping("/api/rept/admin/qualified-receivers")
@Validated
public class ReptQualifiedReceiverAdminController {

  private final ReptQualifiedReceiverService service;

  public ReptQualifiedReceiverAdminController(ReptQualifiedReceiverService service) {
    this.service = service;
  }

  @GetMapping
  public List<ReptQualifiedReceiverDto> search(
      @RequestParam(value = "q", required = false) String query,
      @RequestParam(value = "active", required = false) Boolean active) {
    ReptQualifiedReceiverSearchCriteria criteria = new ReptQualifiedReceiverSearchCriteria(query, active);
    return service.search(criteria);
  }

  @GetMapping("/{id}")
  public ResponseEntity<ReptQualifiedReceiverDto> find(@PathVariable("id") Long id) {
    return service.find(id)
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PostMapping
  public ResponseEntity<ReptQualifiedReceiverDto> create(
      @Valid @RequestBody ReptQualifiedReceiverUpsertRequestDto request) {
    ReptQualifiedReceiverDto dto = service.create(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(dto);
  }

  @PutMapping("/{id}")
  public ResponseEntity<ReptQualifiedReceiverDto> update(
      @PathVariable("id") Long id,
      @Valid @RequestBody ReptQualifiedReceiverUpsertRequestDto request) {
    ReptQualifiedReceiverDto dto = service.update(id, request);
    return ResponseEntity.ok(dto);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
  }
}
