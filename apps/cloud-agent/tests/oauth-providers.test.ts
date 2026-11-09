import test from "node:test";
import assert from "node:assert/strict";
import {allowedOAuthLogin,createSessionToken,getSessionLogin,verifySessionToken} from "../lib/auth";
import {callbackUrl,isOAuthProvider,stateCookieName} from "../lib/oauth-providers";
process.env.SESSION_SECRET="test-only-session-secret-with-more-than-32-characters";
test("recognizes only supported OAuth providers",()=>{assert.equal(isOAuthProvider("github"),true);assert.equal(isOAuthProvider("google"),true);assert.equal(isOAuthProvider("discord"),true);assert.equal(isOAuthProvider("twitter"),false);});
test("builds provider-specific callback URLs and state cookie names",()=>{process.env.APP_ORIGIN="https://auth.example.test";assert.equal(callbackUrl("github"),"https://auth.example.test/api/auth/callback");assert.equal(callbackUrl("google"),"https://auth.example.test/api/auth/callback/google");assert.equal(stateCookieName("discord"),"ocode_oauth_state_discord");});
test("signs and verifies sessions for each provider",()=>{for(const provider of ["github","google","discord"]){const token=createSessionToken("person@example.test",1_800_000_000_000,provider);assert.equal(verifySessionToken(token,1_800_000_000_000),true);assert.equal(getSessionLogin(token,1_800_000_000_000),"person@example.test");}});
test("requires explicit provider-specific allowlists",()=>{process.env.GOOGLE_ALLOWED_USERS="person@example.test";process.env.DISCORD_ALLOWED_USERS="discord-user";assert.equal(allowedOAuthLogin("google","PERSON@example.test"),true);assert.equal(allowedOAuthLogin("discord","discord-user"),true);assert.equal(allowedOAuthLogin("github","person@example.test"),false);});
