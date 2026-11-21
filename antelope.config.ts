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
        version: "0.22.0",
      },
      config: {
        apiBaseUrl: "${@api.API_PUBLIC_BASE_URL}",
        mcp: { backendUrl: "${@api.API_LOCAL_BASE_URL}" },
        builder: { projectRoot: __dirname },
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
    "dms-assistant": {
      source: {
        type: "package",
        package: "@antelopejs/dms-assistant",
        version: "0.3.0",
      },
      config: {
        backendUrl: "${@api.API_LOCAL_BASE_URL}",
      },
    },

    mongodb: {
      source: {
        type: "package",
        package: "@antelopejs/mongodb",
        version: "1.8.12",
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
        version: "1.1.3",
      },
      config: {
        secret: "dev",
      },
    },
    api: {
      source: {
        type: "package",
        package: "@antelopejs/api",
        version: "1.7.8",
      },
      config: {
        servers: [{ protocol: "http", port: 5010 }],
      },
    },
    "file-storage-local": {
      source: {
        type: "package",
        package: "@antelopejs/file-storage-local",
        version: "0.2.2",
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
        version: "0.0.13",
      },
      config: {
        ethereal: true,
      },
    },
  },
});
