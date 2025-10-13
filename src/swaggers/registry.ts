  
import { AuthSwaggerDocs } from "../api/auth/swagger";
import { DistrictSwaggerDocs } from "../api/district/swagger";
import { ProfileSwaggerDocs } from "../api/profile/swagger";
import { ProvinceSwaggerDocs } from "../api/province/swagger";
import { UserSwaggerDocs } from "../api/user/swagger";
import { VillageSwaggerDocs } from "../api/village/swagger";
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
    ...ProvinceSwaggerDocs.paths,
    ...ProfileSwaggerDocs.paths, 
    ...DistrictSwaggerDocs.paths, 
    ...VillageSwaggerDocs.paths, 
  },
};
