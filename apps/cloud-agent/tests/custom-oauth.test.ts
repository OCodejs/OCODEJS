import test from "node:test";
import assert from "node:assert/strict";
import {allowedOAuthLogin,createSessionToken,getSessionLogin,verifySessionToken} from "../lib/auth";
import {customOAuthCallbackUrl,customOAuthConfigured,createPkceVerifier,pkceChallenge,customOAuthStateCookie,customOAuthVerifierCookie} from "../lib/custom-oauth";
process.env.SESSION_SECRET="test-only-session-secret-with-more-than-32-characters";
test("accepts custom provider sessions",()=>{const token=createSessionToken("member@example.test",1_800_000_000_000,"custom");assert.equal(verifySessionToken(token,1_800_000_000_000),true);assert.equal(getSessionLogin(token,1_800_000_000_000),"member@example.test");});
test("uses a dedicated custom callback and state cookies",()=>{process.env.APP_ORIGIN="https://portal.example.test";assert.equal(customOAuthCallbackUrl(),"https://portal.example.test/api/auth/custom/callback");assert.equal(customOAuthStateCookie(),"ocode_custom_oauth_state");assert.equal(customOAuthVerifierCookie(),"ocode_custom_oauth_verifier");});
test("creates PKCE verifier and deterministic S256 challenge",()=>{const verifier=createPkceVerifier();assert.ok(verifier.length>=43);assert.equal(pkceChallenge(verifier),pkceChallenge(verifier));});
test("requires explicit custom credentials and allowlist",()=>{delete process.env.CUSTOM_OAUTH_CLIENT_ID;assert.equal(customOAuthConfigured(),false);process.env.CUSTOM_ALLOWED_USERS="member@example.test";assert.equal(allowedOAuthLogin("custom","MEMBER@example.test"),true);assert.equal(allowedOAuthLogin("custom","other@example.test"),false);});
