/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    // Auth disabled — stub so existing code using Astro.locals.auth?.()?.userId compiles
    auth?: () => { userId: string | null } | null;
  }
}
