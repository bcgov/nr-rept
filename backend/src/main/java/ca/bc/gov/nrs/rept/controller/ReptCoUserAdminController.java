package ca.bc.gov.nrs.rept.controller;

import ca.bc.gov.nrs.rept.dto.rept.admin.ReptCoUserDto;
import ca.bc.gov.nrs.rept.dto.rept.admin.ReptCoUserSearchCriteria;
import ca.bc.gov.nrs.rept.dto.rept.admin.ReptCoUserUpsertRequestDto;
import ca.bc.gov.nrs.rept.service.rept.admin.ReptCoUserAdminService;
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
@RequestMapping("/api/rept/admin/co-users")
@Validated
public class ReptCoUserAdminController {

  private final ReptCoUserAdminService service;

  public ReptCoUserAdminController(ReptCoUserAdminService service) {
    this.service = service;
  }

  @GetMapping
  public List<ReptCoUserDto> search(
      @RequestParam(value = "q", required = false) String query,
      @RequestParam(value = "external", required = false) Boolean external) {
    return service.search(new ReptCoUserSearchCriteria(query, external));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ReptCoUserDto> find(@PathVariable("id") Long id) {
    return service.find(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PostMapping
  public ResponseEntity<ReptCoUserDto> create(@Valid @RequestBody ReptCoUserUpsertRequestDto request) {
    ReptCoUserDto dto = service.create(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(dto);
  }

  @PutMapping("/{id}")
  public ResponseEntity<ReptCoUserDto> update(
      @PathVariable("id") Long id,
      @Valid @RequestBody ReptCoUserUpsertRequestDto request) {
    ReptCoUserDto dto = service.update(id, request);
    return ResponseEntity.ok(dto);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @PathVariable("id") Long id, @RequestParam("revision") Long revision) {
    service.delete(id, revision);
    return ResponseEntity.noContent().build();
  }
}
