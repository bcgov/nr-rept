package ca.bc.gov.nrs.hrs.repository.rept;

/**
 * SQL fragments that mirror the legacy REPT welcome page queries. Keeping them in a dedicated
 * class emulates the approach in nr-silva where SQL is centrally managed for reuse and testing.
 */
public final class ReptWelcomeSql {

  public static final String FIND_RECENT_PROJECTS =
      "SELECT * FROM (" +
          "  SELECT " +
          "    rp.REPT_PROJECT_ID AS REPT_PROJECT_ID, " +
          "    rp.FILE_PREFIX AS FILE_PREFIX, " +
          "    rp.PROJECT_NUMBER AS PROJECT_NUMBER, " +
          "    rp.FILE_SUFFIX AS FILE_SUFFIX, " +
          "    rp.PROJECT_NAME AS PROJECT_NAME, " +
          "    rp.REQUEST_DATE AS REQUEST_DATE " +
          "  FROM REPT_PROJECT rp " +
          "  ORDER BY rp.REQUEST_DATE DESC NULLS LAST" +
          ") WHERE ROWNUM <= ?";

  private ReptWelcomeSql() {
    // utility class
  }
}
