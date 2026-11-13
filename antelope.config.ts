import { defineConfig } from "@antelopejs/interface-core/config";

export default defineConfig({
  name: "template-dms-connect-demo",
  envOverrides: {
    MONGODB_URL: "modules.mongodb.config.url",
  },
  modules: {
    "template-dms-connect-demo": {
      source: {
        type: "local",
        path: ".",
        watchDir: ["src"],
        installCommand: ["pnpm install", "pnpm exec tsc"],
        reloadCommand: ["pnpm exec tsc"],
      },
    },

    dms: {
      source: {
        type: "package",
        package: "@antelopejs/dms",
        version: ">=0.19.4 <1.0.0",
      },
      config: {
        apiBaseUrl: "${@api.API_PUBLIC_BASE_URL}",
        homepage: "/home",
        meta: {
          title: "AntelopeJS DMS",
          description: "AntelopeJS DMS connect demo",
        },
        auth: {
          jwtSecret: "dev",
        },
        frontend: {
          bootstrapSecret: "",
        },
      },
    },
    "dms-builder": {
      source: {
        type: "package",
        package: "@antelopejs/dms-builder",
        version: ">=0.11.0 <1.0.0",
      },
      config: {
        projectRoot: __dirname,
      },
    },
    "dms-ai": {
      source: {
        type: "package",
        package: "@antelopejs/dms-ai",
        version: ">=0.10.2 <1.0.0",
      },
      config: {
        backendUrl: "${@api.API_LOCAL_BASE_URL}",
      },
    },

    mongodb: {
      source: {
        type: "package",
        package: "@antelopejs/mongodb",
        version: "^1.7.0",
      },
      config: {
        url: "mongodb://localhost:27017",
        database: "dms_connect_demo",
      },
    },
    "auth-jwt": {
      source: {
        type: "package",
        package: "@antelopejs/auth-jwt",
        version: "^1.1.1",
      },
      config: {
        secret: "dev",
      },
    },
    api: {
      source: {
        type: "package",
        package: "@antelopejs/api",
        version: "^1.7.3",
      },
      config: {
        servers: [{ protocol: "http", port: 5010 }],
      },
    },
    "file-storage-local": {
      source: {
        type: "package",
        package: "@antelopejs/file-storage-local",
        version: "^0.2.1",
      },
      config: {
        storagePath: ".antelope/file-storage",
        baseUrl: "${@api.API_PUBLIC_BASE_URL}",
        defaultVisibility: "private",
      },
    },
    nodemailer: {
      source: {
        type: "package",
        package: "@antelopejs/nodemailer",
        version: ">=0.0.11 <1.0.0",
      },
      config: {
        ethereal: true,
      },
    },
  },
});
