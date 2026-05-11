package ca.bc.gov.nrs.hrs.configuration;

import java.io.IOException;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Configures Spring MVC to serve the React SPA from static resources.
 * <p>
 * The frontend build output is placed in {@code src/main/resources/static} during
 * the Docker build, and this configuration ensures:
 * <ul>
 *   <li>Static assets (JS, CSS, images, etc.) are served from their actual paths.</li>
 *   <li>Any unmatched GET request (SPA client-side routes) falls back to {@code index.html}.</li>
 * </ul>
 */
@Configuration
public class SpaWebMvcConfiguration implements WebMvcConfigurer {

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // Serve static assets from classpath:/static/
    registry
        .addResourceHandler("/**")
        .addResourceLocations("classpath:/static/dist/")
        .resourceChain(true)
        .addResolver(new PathResourceResolver() {
          @Override
          protected Resource getResource(String resourcePath, Resource location) throws IOException {
            Resource requestedResource = location.createRelative(resourcePath);

            // If the requested resource exists and is readable, serve it
            if (requestedResource.exists() && requestedResource.isReadable()) {
              return requestedResource;
            }

            // Otherwise, return index.html for SPA client-side routing
            // but only for non-API paths (API 404s should remain 404s)
            if (!resourcePath.startsWith("api/") && !resourcePath.startsWith("actuator/")) {
              return new ClassPathResource("/static/dist/index.html");
            }

            return null;
          }
        });
  }
}
