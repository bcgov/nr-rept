package ca.bc.gov.nrs.rept;

import static org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

@SpringBootApplication
@EnableAspectJAutoProxy(proxyTargetClass = true)
@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)
public class ReptApiApplication extends SpringBootServletInitializer {

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
		return builder.sources(ReptApiApplication.class);
	}

	public static void main(String[] args) {
		SpringApplication.run(ReptApiApplication.class, args);
	}

}
