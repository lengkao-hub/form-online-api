
import { AuthSwaggerDocs } from "../api/auth/swagger";
import { ProfileSwaggerDocs } from "../api/profile/swagger";
import { UserSwaggerDocs } from "../api/user/swagger";
import { PaginatedResponseSwaggerDocs } from "./paginate";

export const RegistrySwaggerDocs = {
  components: {
    schemas: {
      ...AuthSwaggerDocs.components.schemas,
      ...PaginatedResponseSwaggerDocs.components.schemas,
    },
  },
  paths: {
    ...AuthSwaggerDocs.paths,
    ...UserSwaggerDocs.paths,
    ...ProfileSwaggerDocs.paths,
  },
};
