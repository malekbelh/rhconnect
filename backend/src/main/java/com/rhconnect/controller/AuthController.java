package com.rhconnect.controller;

import com.rhconnect.dto.request.LoginRequest;
import com.rhconnect.dto.request.RefreshTokenRequest;
import com.rhconnect.dto.request.RegisterRequest;
import com.rhconnect.dto.response.ApiResponse;
import com.rhconnect.dto.response.AuthResponse;
import com.rhconnect.dto.response.UserResponse;
import com.rhconnect.service.AuthService;
import com.rhconnect.service.TokenCleanupService;
import com.rhconnect.service.util.CurrentUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Endpoints d'authentification (inscription, connexion, refresh, logout, profil)")
public class AuthController {

    private final AuthService authService;
    private final TokenCleanupService tokenCleanupService;

    @PostMapping("/register")
    @Operation(summary = "Inscription d'un nouvel utilisateur", description = "Crée un compte CANDIDATE ou COMPANY avec son profil associé vide.")
    public ResponseEntity<AuthResponse> register(@RequestBody @Valid RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Connexion utilisateur", description = "Vérifie les identifiants et retourne les tokens JWT (access + refresh).")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Rafraîchir l'access token", description = "Utilise le refresh token pour obtenir une nouvelle paire access+refresh (rotation).")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody @Valid RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Déconnexion", description = "Révoque le refresh token fourni.")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody @Valid RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Logged out"));
    }

    @GetMapping("/password-policy")
    @Operation(summary = "Politique de mot de passe", description = "Retourne les exigences pour les mots de passe.")
    public ResponseEntity<java.util.Map<String, Object>> getPasswordPolicy() {
        java.util.Map<String, Object> policy = new java.util.HashMap<>();
        policy.put("description", com.rhconnect.util.PasswordPolicyValidator.getPolicyDescription());
        policy.put("minLength", com.rhconnect.util.PasswordPolicyValidator.MIN_LENGTH);
        policy.put("maxLength", com.rhconnect.util.PasswordPolicyValidator.MAX_LENGTH);
        policy.put("requirements", new String[]{
            "Au moins 1 majuscule (A-Z)",
            "Au moins 1 minuscule (a-z)",
            "Au moins 1 chiffre (0-9)",
            "Au moins 1 caractère spécial (!@#$%^&*()_+-=[]{};\\'\"<>?,./\\\\|`~)",
            "Pas d'espaces",
            "Pas de mots courants"
        });
        return ResponseEntity.ok(policy);
    }

    @PostMapping("/validate-password")
    @Operation(summary = "Valider un mot de passe", description = "Vérifie si un mot de passe respecte la politique et retourne sa force.")
    public ResponseEntity<java.util.Map<String, Object>> validatePassword(@RequestBody java.util.Map<String, String> body) {
        String password = body.get("password");
        java.util.List<String> violations = com.rhconnect.util.PasswordPolicyValidator.getViolations(password);
        int strength = com.rhconnect.util.PasswordPolicyValidator.calculatePasswordStrength(password);
        String strengthLabel = com.rhconnect.util.PasswordPolicyValidator.getStrengthLabel(strength);
        
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("valid", violations.isEmpty());
        result.put("violations", violations);
        result.put("strength", strength);
        result.put("strengthLabel", strengthLabel);
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Profil utilisateur courant", description = "Retourne l'utilisateur connecté avec son profil détaillé (candidate ou company).")
    public ResponseEntity<UserResponse> me() {
        String userId = CurrentUserService.getCurrentUserId();
        UserResponse response = authService.me(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me/email")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Modifier mon email", description = "Met à jour l'email du compte courant après vérification du mot de passe.")
    public ResponseEntity<ApiResponse<Void>> changeMyEmail(@RequestBody java.util.Map<String, String> body) {
        String newEmail = body.get("newEmail");
        String password = body.get("password");
        authService.changeMyEmail(newEmail, password);
        return ResponseEntity.ok(ApiResponse.success("Email mis à jour"));
    }

    @PutMapping("/me/password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Modifier mon mot de passe", description = "Met à jour le mot de passe du compte courant après vérification du mot de passe actuel.")
    public ResponseEntity<ApiResponse<Void>> changeMyPassword(@RequestBody java.util.Map<String, String> body) {
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        authService.changeMyPassword(currentPassword, newPassword);
        return ResponseEntity.ok(ApiResponse.success("Mot de passe mis à jour"));
    }

    @DeleteMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Supprimer mon compte", description = "Supprime le compte courant après vérification du mot de passe.")
    public ResponseEntity<ApiResponse<Void>> deleteMyAccount(@RequestBody java.util.Map<String, String> body) {
        String password = body.get("password");
        authService.deleteMyAccount(password);
        return ResponseEntity.ok(ApiResponse.success("Compte supprimé"));
    }

    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Liste tous les utilisateurs", description = "ADMIN uniquement - Retourne la liste paginée des utilisateurs.")
    public ResponseEntity<Page<UserResponse>> getAllUsers(@PageableDefault(size = 20) Pageable pageable) {
        Page<UserResponse> response = authService.getAllUsers(pageable);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/admin/users/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activer / Désactiver un utilisateur", description = "ADMIN uniquement - Inverse le statut actif d'un compte.")
    public ResponseEntity<UserResponse> toggleUserStatus(@PathVariable String id) {
        return ResponseEntity.ok(authService.toggleUserStatus(id));
    }

    @PatchMapping("/admin/users/{id}/toggle-verification")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Certifier / Révoquer certification utilisateur", description = "ADMIN uniquement - Inverse le statut vérifié/certifié d'un compte.")
    public ResponseEntity<UserResponse> toggleUserVerification(@PathVariable String id) {
        return ResponseEntity.ok(authService.toggleUserVerification(id));
    }

    @PatchMapping("/admin/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modifier le rôle d'un utilisateur", description = "ADMIN uniquement - Change le rôle d'un utilisateur.")
    public ResponseEntity<UserResponse> updateUserRole(@PathVariable String id, @RequestBody java.util.Map<String, String> body) {
        String role = body.get("role");
        return ResponseEntity.ok(authService.updateUserRole(id, role));
    }

    @GetMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Détail utilisateur enrichi", description = "ADMIN uniquement - Retourne un utilisateur avec son profil candidat/entreprise et ses informations détaillées.")
    public ResponseEntity<UserResponse> getUserDetail(@PathVariable String id) {
        return ResponseEntity.ok(authService.getUserDetail(id));
    }

    @DeleteMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer un utilisateur", description = "ADMIN uniquement - Supprime un compte utilisateur et révoque tous ses tokens. Interdit sur son propre compte.")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable String id) {
        authService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("Utilisateur supprimé"));
    }

    @PatchMapping("/admin/users/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Réinitialiser le mot de passe", description = "ADMIN uniquement - Force un nouveau mot de passe sur le compte d'un utilisateur.")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable String id,
            @RequestBody java.util.Map<String, String> body) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.isBlank()) {
            throw new com.rhconnect.exception.BusinessException("Le nouveau mot de passe est requis", "MISSING_PASSWORD", 400);
        }
        authService.resetUserPassword(id, newPassword);
        return ResponseEntity.ok(ApiResponse.success("Mot de passe réinitialisé"));
    }

    @PostMapping("/admin/users/{id}/impersonate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Se connecter en tant que (impersonation)", description = "ADMIN uniquement - Génère un access token valide pour le compte cible et retourne aussi les tokens originaux pour revenir en arrière.")
    public ResponseEntity<java.util.Map<String, Object>> impersonate(@PathVariable String id) {
        java.util.Map<String, Object> result = authService.impersonateUser(id);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/admin/users/{id}/sessions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Sessions d'un utilisateur", description = "ADMIN uniquement - Liste les refresh tokens (sessions) actifs et révoqués d'un utilisateur.")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> getUserSessions(@PathVariable String id) {
        return ResponseEntity.ok(authService.getUserSessions(id));
    }

    @PostMapping("/admin/maintenance/cleanup-tokens")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Nettoyer les tokens expirés", description = "ADMIN uniquement - Force le nettoyage des tokens expirés ou révoqués. À utiliser en maintenance.")
    public ResponseEntity<ApiResponse<String>> cleanupExpiredTokens() {
        long deletedCount = tokenCleanupService.manualCleanup();
        return ResponseEntity.ok(ApiResponse.success("Nettoyage terminé: " + deletedCount + " tokens supprimés"));
    }

    // ========== PASSWORD RESET (Mot de passe oublié) ==========

    @PostMapping("/forgot-password")
    @Operation(summary = "Demande de réinitialisation de mot de passe", description = "Étape 1: Envoie un email avec un lien de réinitialisation. Ne révèle pas si l'email existe.")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestBody java.util.Map<String, String> body) {
        String email = body.get("email");
        authService.requestPasswordReset(email);
        return ResponseEntity.ok(ApiResponse.success(
                "Si un compte correspond à cet email, un lien de réinitialisation a été envoyé. Validez pendant 30 min."
        ));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Confirmer la réinitialisation de mot de passe", description = "Étape 2: Valide le token et remplace le mot de passe. Tous les tokens de connexion actifs sont révoqués.")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody java.util.Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");
        authService.confirmPasswordReset(token, newPassword);
        return ResponseEntity.ok(ApiResponse.success("Mot de passe réinitialisé avec succès. Vous pouvez vous reconnecter."));
    }

}
