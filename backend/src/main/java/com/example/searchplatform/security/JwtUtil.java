package com.example.searchplatform.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

/**
 * JWT utility — token generation and validation using HS256.
 *
 * Token payload:
 *   sub  — username
 *   role — USER | ADMIN
 *   iat  — issued-at (epoch seconds)
 *   exp  — expiry    (epoch seconds)
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expirationMs;   // milliseconds (e.g. 86400000 = 24 h)

    // ── Key ──────────────────────────────────────────────────
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    // ── Generate ─────────────────────────────────────────────
    public String generateToken(String username, String role) {
        Date now    = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ── Extract ──────────────────────────────────────────────
    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return (String) parseClaims(token).get("role");
    }

    public Date extractExpiration(String token) {
        return parseClaims(token).getExpiration();
    }

    // ── Validate ─────────────────────────────────────────────

    /**
     * Returns true if the token signature is valid and it has not expired.
     * All JwtException subtypes (expired, malformed, unsupported, wrong key)
     * are caught and treated as invalid.
     */
    public boolean validateToken(String token) {
        try {
            Claims claims = parseClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // ── Internal ─────────────────────────────────────────────
    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
