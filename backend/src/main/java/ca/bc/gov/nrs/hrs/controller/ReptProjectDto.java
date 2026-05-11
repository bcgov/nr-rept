package ca.bc.gov.nrs.hrs.controller;

/**
 * Minimal DTO representing the project information we need on the welcome page.
 */
public class ReptProjectDto {
  private Long id;
  private String filePrefix;
  private Long projectNumber;
  private String fileSuffix;
  private String projectName;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getFilePrefix() {
    return filePrefix;
  }

  public void setFilePrefix(String filePrefix) {
    this.filePrefix = filePrefix;
  }

  public Long getProjectNumber() {
    return projectNumber;
  }

  public void setProjectNumber(Long projectNumber) {
    this.projectNumber = projectNumber;
  }

  public String getFileSuffix() {
    return fileSuffix;
  }

  public void setFileSuffix(String fileSuffix) {
    this.fileSuffix = fileSuffix;
  }

  public String getProjectName() {
    return projectName;
  }

  public void setProjectName(String projectName) {
    this.projectName = projectName;
  }
}
