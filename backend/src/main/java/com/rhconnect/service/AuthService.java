package com.rhconnect.service;

import com.rhconnect.audit.Audit;
import com.rhconnect.audit.AuditService;
import com.rhconnect.dto.request.LoginRequest;
import com.rhconnect.dto.request.RegisterRequest;
import com.rhconnect.dto.response.AuthResponse;
import com.rhconnect.dto.response.CandidateProfileResponse;
import com.rhconnect.dto.response.CompanyProfileResponse;
import com.rhconnect.dto.response.UserResponse;
import com.rhconnect.exception.BusinessException;
import com.rhconnect.exception.EntityNotFoundException;
import com.rhconnect.model.CandidateProfile;
import com.rhconnect.model.CompanyProfile;
import com.rhconnect.model.PasswordResetToken;
import com.rhconnect.model.RefreshToken;
import com.rhconnect.model.User;
import com.rhconnect.model.enums.Role;
import com.rhconnect.model.enums.VerificationStatus;
import com.rhconnect.repository.CandidateProfileRepository;
import com.rhconnect.repository.CompanyProfileRepository;
import com.rhconnect.repository.PasswordResetTokenRepository;
import com.rhconnect.repository.RefreshTokenRepository;
import com.rhconnect.repository.UserRepository;
import com.rhconnect.repository.UserSettingsRepository;
import com.rhconnect.security.JwtService;
import com.rhconnect.service.util.CurrentUserService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;



@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final RefreshTokenService refreshTokenService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final EmailNotificationService emailNotificationService;
    private final UserNotificationService userNotificationService;
    private final com.rhconnect.repository.VerificationRepository verificationRepository;

    @Value("${rhconnect.password.reset.token-ttl-minutes:30}")
    private long passwordResetTokenTtlMinutes;

    @Value("${rhconnect.app.base-url:http://localhost:5173}")
    private String appBaseUrl;

    @Value("${rhconnect.jwt.access-token-ttl-seconds:3600}")
    private long accessTokenTtlSeconds;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.getRole() == Role.ADMIN || request.getRole() == Role.RECRUITER) {
            throw new BusinessException("Ce rôle n'est pas autorisé à l'inscription", "ROLE_NOT_ALLOWED", 400);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Cet email est déjà utilisé", "EMAIL_ALREADY_EXISTS", 409);
        }

        // Valider la politique de mot de passe
        com.rhconnect.util.PasswordPolicyValidator.validatePassword(request.getPassword());

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(List.of(request.getRole()))
                .enabled(true)
                .verified(false)
                .build();
        user = userRepository.save(user);

        if (request.getRole() == Role.CANDIDATE) {
            CandidateProfile profile = CandidateProfile.builder()
                    .userId(user.getId())
                    .firstName(request.getFirstName())
                    .lastName(request.getLastName())
                    .phone(request.getPhone())
                    .address(request.getAddress())
                    .build();
            candidateProfileRepository.save(profile);
            
            // Envoyer email de bienvenue candidat
            emailNotificationService.sendCandidateWelcomeEmailAsync(user.getEmail(), "Candidat");
            
            // Notifier les admins
            userNotificationService.createAdminNotification(
                    "NEW_CANDIDATE",
                    "Nouveau candidat inscrit",
                    "Un nouveau candidat " + user.getEmail() + " vient de s'inscrire.",
                    "/admin/candidates"
            );
        } else if (request.getRole() == Role.COMPANY) {
            CompanyProfile profile = CompanyProfile.builder()
                    .userId(user.getId())
                    .companyName(request.getCompanyName())
                    .siret(request.getSiret())
                    .phone(request.getPhone())
                    .address(request.getAddress())
                    .verifiedStatus(VerificationStatus.EN_ATTENTE)
                    .build();
            CompanyProfile savedProfile = companyProfileRepository.save(profile);
            
            // Créer le dossier de vérification entreprise
            verificationRepository.save(com.rhconnect.model.Verification.builder()
                    .candidateId(savedProfile.getId())
                    .pieces(new java.util.ArrayList<>())
                    .statut(VerificationStatus.EN_ATTENTE)
                    .createdAt(LocalDateTime.now())
                    .build());
            
            // Envoyer email de bienvenue entreprise
            emailNotificationService.sendCompanyWelcomeEmailAsync(user.getEmail(), "Entreprise");
            
            // Notifier les admins
            userNotificationService.createAdminNotification(
                    "NEW_COMPANY",
                    "Nouvelle entreprise inscrite",
                    "Une nouvelle entreprise " + user.getEmail() + " vient de s'inscrire.",
                    "/admin/verifications"
            );
        }

        Map<String, Object> registerDetails = new HashMap<>();
        registerDetails.put("email", user.getEmail());
        registerDetails.put("role", request.getRole().name());
        auditService.logAsUser(user.getId(), user.getEmail(), user.getRoles(),
                "USER_REGISTER", "User", user.getId(), registerDetails, extractClientIp());

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    Map<String, Object> failDetails = new HashMap<>();
                    failDetails.put("email", request.getEmail());
                    failDetails.put("reason", "USER_NOT_FOUND");
                    auditService.logAsUser(null, request.getEmail(), null,
                            "LOGIN_FAILURE", "Auth", null, failDetails, extractClientIp());
                    return new BusinessException("Identifiants invalides", "INVALID_CREDENTIALS", 401);
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            Map<String, Object> failDetails = new HashMap<>();
            failDetails.put("email", request.getEmail());
            failDetails.put("reason", "BAD_PASSWORD");
            auditService.logAsUser(null, request.getEmail(), null,
                    "LOGIN_FAILURE", "Auth", null, failDetails, extractClientIp());
            throw new BusinessException("Identifiants invalides", "INVALID_CREDENTIALS", 401);
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        Map<String, Object> loginDetails = new HashMap<>();
        loginDetails.put("email", user.getEmail());
        loginDetails.put("roles", user.getRoles().stream().map(Enum::name).collect(Collectors.toList()));
        auditService.logAsUser(user.getId(), user.getEmail(), user.getRoles(),
                "LOGIN_SUCCESS", "Auth", user.getId(), loginDetails, extractClientIp());

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshTokenStr) {
        RefreshToken refreshToken = refreshTokenService.validateRefreshToken(refreshTokenStr);
        User user = refreshTokenService.getUserFromRefreshToken(refreshToken);

        refreshTokenService.revokeRefreshToken(refreshTokenStr);

        return buildAuthResponse(user);
    }

    @Transactional
    public void logout(String refreshTokenStr) {
        User logoutUser = null;
        try {
            RefreshToken rt = refreshTokenService.findByToken(refreshTokenStr);
            logoutUser = userRepository.findById(rt.getUserId()).orElse(null);
            refreshTokenService.revokeRefreshToken(refreshTokenStr);
        } catch (BusinessException e) {
        }

        if (logoutUser != null) {
            Map<String, Object> logoutDetails = new HashMap<>();
            logoutDetails.put("email", logoutUser.getEmail());
            auditService.logAsUser(logoutUser.getId(), logoutUser.getEmail(), logoutUser.getRoles(),
                    "LOGOUT", "Auth", logoutUser.getId(), logoutDetails, extractClientIp());
        }
    }

    @Audit(action = "USER_ME", entityType = "User", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    public UserResponse me(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Utilisateur non trouvé", "USER_NOT_FOUND", 404));
        return buildEnrichedUserResponse(user);
    }

    @Transactional
    public void changeMyEmail(String newEmail, String password) {
        String userId = CurrentUserService.getCurrentUserId();
        if (userId == null || userId.isBlank()) {
            throw new BusinessException("Utilisateur non authentifié", "UNAUTHORIZED", 401);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Utilisateur non trouvé", "USER_NOT_FOUND", 404));

        if (password == null || password.isBlank() || !passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException("Mot de passe actuel incorrect", "INVALID_CURRENT_PASSWORD", 401);
        }

        String normalizedEmail = newEmail == null ? "" : newEmail.trim();
        if (normalizedEmail.isBlank()) {
            throw new BusinessException("Le nouvel email est requis", "MISSING_EMAIL", 400);
        }

        userRepository.findByEmail(normalizedEmail)
                .ifPresent(existing -> {
                    if (!existing.getId().equals(userId)) {
                        throw new BusinessException("Cet email est déjà utilisé", "EMAIL_ALREADY_EXISTS", 409);
                    }
                });

        user.setEmail(normalizedEmail);
        userRepository.save(user);
    }

    @Transactional
    public void changeMyPassword(String currentPassword, String newPassword) {
        String userId = CurrentUserService.getCurrentUserId();
        if (userId == null || userId.isBlank()) {
            throw new BusinessException("Utilisateur non authentifié", "UNAUTHORIZED", 401);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Utilisateur non trouvé", "USER_NOT_FOUND", 404));

        if (currentPassword == null || currentPassword.isBlank() || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BusinessException("Mot de passe actuel incorrect", "INVALID_CURRENT_PASSWORD", 401);
        }

        if (newPassword == null || newPassword.isBlank()) {
            throw new BusinessException("Le nouveau mot de passe est requis", "MISSING_NEW_PASSWORD", 400);
        }

        // Valider la politique de mot de passe
        com.rhconnect.util.PasswordPolicyValidator.validatePassword(newPassword);

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void deleteMyAccount(String password) {
        String userId = CurrentUserService.getCurrentUserId();
        if (userId == null || userId.isBlank()) {
            throw new BusinessException("Utilisateur non authentifié", "UNAUTHORIZED", 401);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Utilisateur non trouvé", "USER_NOT_FOUND", 404));

        if (password == null || password.isBlank() || !passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException("Mot de passe actuel incorrect", "INVALID_CURRENT_PASSWORD", 401);
        }

        refreshTokenService.revokeAllUserRefreshTokens(userId);

        candidateProfileRepository.findByUserId(userId).ifPresent(candidateProfileRepository::delete);
        companyProfileRepository.findByUserId(userId).ifPresent(companyProfileRepository::delete);
        userSettingsRepository.findByUserId(userId).ifPresent(userSettingsRepository::delete);

        userRepository.delete(user);
    }

    @Audit(action = "USER_LIST", entityType = "User")
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::buildEnrichedUserResponse);
    }

    @Audit(action = "USER_TOGGLE_VERIFICATION", entityType = "User", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    public UserResponse toggleUserVerification(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        boolean currentVerified = user.isVerified();
        if (user.getRoles().contains(Role.COMPANY)) {
            var cpOpt = companyProfileRepository.findByUserId(userId);
            if (cpOpt.isPresent() && cpOpt.get().getVerifiedStatus() == VerificationStatus.VALIDE) {
                currentVerified = true;
            }
        }

        boolean newVerified = !currentVerified;
        user.setVerified(newVerified);
        user = userRepository.save(user);

        if (user.getRoles().contains(Role.COMPANY)) {
            companyProfileRepository.findByUserId(userId).ifPresent(cp -> {
                cp.setVerifiedStatus(newVerified ? VerificationStatus.VALIDE : VerificationStatus.EN_ATTENTE);
                companyProfileRepository.save(cp);
            });
        }
        return buildEnrichedUserResponse(user);
    }

    @Audit(action = "USER_UPDATE_ROLE", entityType = "User", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    public UserResponse updateUserRole(String userId, String roleStr) {
        checkNotSelfOrThrow(userId, "modifier le rôle de");

        Role newRole = Role.valueOf(roleStr.toUpperCase());
        Claims claims = CurrentUserService.getCurrentClaims();
        if (newRole == Role.ADMIN && !currentUserHasRole(Role.ADMIN, claims)) {
            throw new BusinessException("Seul un ADMIN peut attribuer le rôle ADMIN", "INSUFFICIENT_PRIVILEGE", 403);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        user.setRoles(List.of(newRole));
        user = userRepository.save(user);
        return buildSimpleUserResponse(user);
    }

    @Audit(action = "USER_TOGGLE_STATUS", entityType = "User", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    public UserResponse toggleUserStatus(String userId) {
        checkNotSelfOrThrow(userId, "activer/désactiver");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        user.setEnabled(!user.isEnabled());
        user = userRepository.save(user);
        return buildSimpleUserResponse(user);
    }

    @Audit(action = "USER_DELETE", entityType = "User", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    public void deleteUser(String userId) {
        checkNotSelfOrThrow(userId, "supprimer");
        Claims claims = CurrentUserService.getCurrentClaims();
        if (!currentUserHasRole(Role.ADMIN, claims)) {
            throw new BusinessException("Seul un ADMIN peut supprimer un utilisateur", "INSUFFICIENT_PRIVILEGE", 403);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        refreshTokenService.revokeAllUserRefreshTokens(userId);
        userRepository.delete(user);
    }

    @Audit(action = "USER_RESET_PASSWORD", entityType = "User", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    public void resetUserPassword(String userId, String newPassword) {
        Claims claims = CurrentUserService.getCurrentClaims();
        if (!currentUserHasRole(Role.ADMIN, claims)) {
            throw new BusinessException("Seul un ADMIN peut réinitialiser un mot de passe", "INSUFFICIENT_PRIVILEGE", 403);
        }
        
        if (newPassword == null || newPassword.isBlank()) {
            throw new BusinessException("Le nouveau mot de passe est requis", "MISSING_NEW_PASSWORD", 400);
        }
        
        // Valider la politique de mot de passe
        com.rhconnect.util.PasswordPolicyValidator.validatePassword(newPassword);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Audit(action = "USER_VIEW_DETAIL", entityType = "User", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    public UserResponse getUserDetail(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        return buildEnrichedUserResponse(user);
    }

    @Audit(action = "USER_IMPERSONATE", entityType = "User", captureEntityIdFromArg = true, entityIdArgIndex = 0)
    public Map<String, Object> impersonateUser(String targetUserId) {
        Claims claims = CurrentUserService.getCurrentClaims();
        if (!currentUserHasRole(Role.ADMIN, claims)) {
            throw new BusinessException("Seul un ADMIN peut se connecter en tant qu'un autre utilisateur", "INSUFFICIENT_PRIVILEGE", 403);
        }
        checkNotSelfOrThrow(targetUserId, "vous impersonner vous-même en tant que");

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new EntityNotFoundException("User", targetUserId));
        if (!target.isEnabled()) {
            throw new BusinessException("Le compte cible est désactivé", "TARGET_DISABLED", 400);
        }

        String currentId = CurrentUserService.getCurrentUserId();
        User current = userRepository.findById(currentId)
                .orElseThrow(() -> new EntityNotFoundException("User", currentId));

        List<String> targetRolesStr = target.getRoles().stream().map(Enum::name).collect(Collectors.toList());
        String impersonatedAccessToken = JwtService.generateAccessToken(target.getId(), targetRolesStr, target.getEmail());

        List<String> currentRolesStr = current.getRoles().stream().map(Enum::name).collect(Collectors.toList());
        String originalAccessToken = JwtService.generateAccessToken(current.getId(), currentRolesStr, current.getEmail());
        RefreshToken originalRefresh = refreshTokenService.createRefreshToken(current.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("accessToken", impersonatedAccessToken);
        result.put("originalAccessToken", originalAccessToken);
        result.put("originalRefreshToken", originalRefresh.getToken());
        result.put("impersonatedUser", buildSimpleUserResponse(target));
        return result;
    }

    public List<Map<String, Object>> getUserSessions(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        List<RefreshToken> tokens = refreshTokenRepository.findByUserId(userId);
        return tokens.stream().map(rt -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", rt.getId());
            m.put("createdAt", rt.getCreatedAt() != null ? rt.getCreatedAt().toString() : null);
            m.put("expiresAt", rt.getExpiresAt() != null ? rt.getExpiresAt().toString() : null);
            m.put("revoked", rt.isRevoked());
            return m;
        }).collect(Collectors.toList());
    }

    // ========== PASSWORD RESET (Mot de passe oublié) ==========

    /**
     * Étape 1 : Demande de réinitialisation - génère un token et envoie un email
     */
    @Transactional
    public void requestPasswordReset(String email) {
        if (email == null || email.isBlank()) {
            throw new BusinessException("L'email est requis", "MISSING_EMAIL", 400);
        }

        String normalizedEmail = email.trim().toLowerCase();

        java.util.Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            // Pour éviter l'énumération des emails, on retourne un succès silencieux
            // même si l'email n'existe pas
            return;
        }

        User user = userOpt.get();

        String token = java.util.UUID.randomUUID().toString().replace("-", "");
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(passwordResetTokenTtlMinutes);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .userId(user.getId())
                .token(token)
                .expiresAt(expiresAt)
                .used(false)
                .build();
        passwordResetTokenRepository.save(resetToken);

        String resetLink = appBaseUrl + "/auth/reset-password?token=" + token;
        emailNotificationService.sendPasswordResetEmailAsync(user.getEmail(), resetLink);

        Map<String, Object> details = new HashMap<>();
        details.put("email", user.getEmail());
        details.put("tokenExpiresAt", expiresAt.toString());
        auditService.logAsUser(user.getId(), user.getEmail(), user.getRoles(),
                "PASSWORD_RESET_REQUESTED", "PasswordReset", null, details, extractClientIp());
    }

    /**
     * Étape 2 : Validation du token + changement de mot de passe
     */
    @Transactional
    public void confirmPasswordReset(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new BusinessException("Le token de réinitialisation est requis", "MISSING_TOKEN", 400);
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new BusinessException("Le nouveau mot de passe est requis", "MISSING_NEW_PASSWORD", 400);
        }

        com.rhconnect.util.PasswordPolicyValidator.validatePassword(newPassword);

        LocalDateTime now = LocalDateTime.now();
        PasswordResetToken resetToken = passwordResetTokenRepository.findValidToken(token, now)
                .orElseThrow(() -> new BusinessException(
                        "Le lien de réinitialisation est invalide ou a expiré.",
                        "INVALID_RESET_TOKEN",
                        400
                ));

        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User", resetToken.getUserId()));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        refreshTokenService.revokeAllUserRefreshTokens(user.getId());

        Map<String, Object> details = new HashMap<>();
        details.put("email", user.getEmail());
        details.put("reason", "Password reset");
        auditService.logAsUser(user.getId(), user.getEmail(), user.getRoles(),
                "PASSWORD_RESET_CONFIRMED", "User", user.getId(), details, extractClientIp());
    }

    private void checkNotSelfOrThrow(String userId, String actionVerb) {
        String currentUserId = CurrentUserService.getCurrentUserId();
        if (currentUserId != null && currentUserId.equals(userId)) {
            throw new BusinessException(
                    "Vous ne pouvez pas " + actionVerb + " votre propre compte",
                    "SELF_ACTION_FORBIDDEN", 400);
        }
    }

    private boolean currentUserHasRole(Role requiredRole, Claims claims) {
        if (claims == null) return false;
        Object rolesObj = claims.get("roles");
        if (rolesObj instanceof List<?> rolesList) {
            return rolesList.contains(requiredRole.name());
        }
        return false;
    }

    private AuthResponse buildAuthResponse(User user) {
        List<String> rolesStr = user.getRoles().stream()
                .map(Enum::name)
                .collect(Collectors.toList());

        String accessToken = JwtService.generateAccessToken(user.getId(), rolesStr, user.getEmail());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(accessTokenTtlSeconds)
                .user(buildSimpleUserResponse(user))
                .build();
    }

    private UserResponse buildSimpleUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .roles(user.getRoles())
                .enabled(user.isEnabled())
                .verified(user.isVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private UserResponse buildEnrichedUserResponse(User user) {
        UserResponse.UserResponseBuilder builder = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .roles(user.getRoles())
                .enabled(user.isEnabled())
                .verified(user.isVerified())
                .createdAt(user.getCreatedAt());

        if (user.getRoles().contains(Role.CANDIDATE)) {
            candidateProfileRepository.findByUserId(user.getId())
                    .ifPresent(p -> builder.candidateProfile(toCandidateProfileResponse(p)));
        } else if (user.getRoles().contains(Role.COMPANY)) {
            companyProfileRepository.findByUserId(user.getId())
                    .ifPresent(p -> {
                        builder.companyProfile(toCompanyProfileResponse(p));
                        if (p.getVerifiedStatus() == VerificationStatus.VALIDE) {
                            builder.verified(true);
                        }
                    });
        }

        return builder.build();
    }

    private CandidateProfileResponse toCandidateProfileResponse(CandidateProfile p) {
        return CandidateProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .phone(p.getPhone())
                .address(p.getAddress())
                .bio(p.getBio())
                .competences(p.getCompetences())
                .parcours(p.getParcours())
                .formation(p.getFormation())
                .cvFileId(p.getCvFileId())
                .cvFileName(p.getCvFileName())
                .photoFileId(p.getPhotoFileId())
                .photoFileName(p.getPhotoFileName())
                .matchingTags(p.getMatchingTags())
                .build();
    }

    private CompanyProfileResponse toCompanyProfileResponse(CompanyProfile p) {
        return CompanyProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .companyName(p.getCompanyName())
                .siret(p.getSiret())
                .sector(p.getIndustry())
                .size(p.getSize())
                .description(p.getDescription())
                .address(p.getAddress())
                .phone(p.getPhone())
                .website(p.getWebsite())
                .verifiedStatus(p.getVerifiedStatus())
                .build();
    }

    private String extractClientIp() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                    return xForwardedFor.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception e) {
        }
        return null;
    }
}
