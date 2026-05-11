package ca.bc.gov.nrs.hrs.controller;

import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptContactAdminDto;
import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptContactSearchCriteria;
import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptContactUpsertRequestDto;
import ca.bc.gov.nrs.hrs.service.rept.admin.ReptContactAdminService;
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
@RequestMapping("/api/rept/admin/contacts")
@Validated
public class ReptContactAdminController {

  private final ReptContactAdminService service;

  public ReptContactAdminController(ReptContactAdminService service) {
    this.service = service;
  }

  @GetMapping
  public List<ReptContactAdminDto> search(
      @RequestParam(value = "firstName", required = false) String firstName,
      @RequestParam(value = "lastName", required = false) String lastName,
      @RequestParam(value = "companyName", required = false) String companyName) {
    return service.search(new ReptContactSearchCriteria(firstName, lastName, companyName));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ReptContactAdminDto> find(@PathVariable("id") Long id) {
    return service.find(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PostMapping
  public ResponseEntity<ReptContactAdminDto> create(
      @Valid @RequestBody ReptContactUpsertRequestDto request) {
    ReptContactAdminDto dto = service.create(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(dto);
  }

  @PutMapping("/{id}")
  public ResponseEntity<ReptContactAdminDto> update(
      @PathVariable("id") Long id,
      @Valid @RequestBody ReptContactUpsertRequestDto request) {
    ReptContactAdminDto dto = service.update(id, request);
    return ResponseEntity.ok(dto);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @PathVariable("id") Long id, @RequestParam("revision") Long revision) {
    service.delete(id, revision);
    return ResponseEntity.noContent().build();
  }
} 
