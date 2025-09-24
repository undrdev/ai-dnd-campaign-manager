using DndAI.Services.Auth.Application.Interfaces;
using DndAI.Services.Auth.Application.Models;
using DndAI.Services.Auth.Application.Validators;
using DndAI.Shared.Domain.Entities;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DndAI.Services.Auth.Controllers;

/// <summary>
/// Authentication controller providing registration, login, and token management endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IUserService userService,
        IJwtTokenService jwtTokenService,
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        ILogger<AuthController> logger)
    {
        _userService = userService;
        _jwtTokenService = jwtTokenService;
        _userManager = userManager;
        _signInManager = signInManager;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user account
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            _logger.LogInformation("Registration attempt for email: {Email}", request.Email);

            // Validate request
            var validator = new RegisterRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new ErrorResponse(
                    "Validation failed",
                    AuthErrorCodes.InvalidInput,
                    validationResult.Errors.GroupBy(x => x.PropertyName)
                        .ToDictionary(g => g.Key, g => g.Select(x => x.ErrorMessage).ToArray())));
            }

            // Check if email already exists
            if (!await _userService.IsEmailAvailableAsync(request.Email))
            {
                return Conflict(new ErrorResponse(
                    "An account with this email already exists",
                    AuthErrorCodes.EmailAlreadyExists));
            }

            // Register user
            var registerUserRequest = new RegisterUserRequest(
                request.FirstName,
                request.LastName,
                request.Email,
                request.Password,
                request.Role,
                request.SubscriptionTier);

            var result = await _userService.RegisterUserAsync(registerUserRequest);

            if (!result.Succeeded)
            {
                return BadRequest(new ErrorResponse(
                    "Registration failed",
                    AuthErrorCodes.InvalidInput,
                    new Dictionary<string, string[]>
                    {
                        ["general"] = result.Errors.Select(e => e.Description).ToArray()
                    }));
            }

            // Get the created user
            var user = await _userService.GetUserByEmailAsync(request.Email);
            if (user == null)
            {
                return BadRequest(new ErrorResponse(
                    "User registration failed",
                    AuthErrorCodes.InvalidInput));
            }

            // Generate email verification token
            var emailToken = await _userService.GenerateEmailConfirmationTokenAsync(user.Id);
            
            // TODO: Send verification email (will be implemented when email service is added)
            _logger.LogInformation("Email verification token generated for user {UserId}: {Token}", 
                user.Id, emailToken);

            var userDto = new UserDto(
                user.Id,
                user.Email!,
                user.UserName!,
                user.FirstName,
                user.LastName,
                user.Role,
                user.SubscriptionTier,
                user.IsActive,
                user.EmailConfirmed,
                user.CreatedAt,
                user.LastLoginAt);

            return CreatedAtAction(nameof(GetProfile), new { userId = user.Id }, new AuthResponse(
                true,
                "Registration successful. Please check your email to verify your account.",
                User: userDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration for email: {Email}", request.Email);
            return StatusCode(500, new ErrorResponse(
                "An error occurred during registration",
                "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Authenticate user and generate JWT tokens
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            _logger.LogInformation("Login attempt for email: {Email}", request.Email);

            // Validate request
            var validator = new LoginRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new ErrorResponse(
                    "Validation failed",
                    AuthErrorCodes.InvalidInput,
                    validationResult.Errors.GroupBy(x => x.PropertyName)
                        .ToDictionary(g => g.Key, g => g.Select(x => x.ErrorMessage).ToArray())));
            }

            // Attempt login
            var result = await _userService.SignInAsync(request.Email, request.Password, request.RememberMe);

            if (!result.Succeeded)
            {
                if (result.IsLockedOut)
                {
                    return Unauthorized(new ErrorResponse(
                        "Account is locked due to multiple failed login attempts",
                        AuthErrorCodes.AccountLocked));
                }

                if (result.IsNotAllowed)
                {
                    return Unauthorized(new ErrorResponse(
                        "Please verify your email address before logging in",
                        AuthErrorCodes.AccountNotVerified));
                }

                return Unauthorized(new ErrorResponse(
                    "Invalid email or password",
                    AuthErrorCodes.InvalidCredentials));
            }

            // Get user and generate tokens
            var user = await _userService.GetUserByEmailAsync(request.Email);
            if (user == null)
            {
                return Unauthorized(new ErrorResponse(
                    "Invalid credentials",
                    AuthErrorCodes.InvalidCredentials));
            }

            var accessToken = await _jwtTokenService.GenerateAccessTokenAsync(user);
            var refreshToken = await _jwtTokenService.GenerateRefreshTokenAsync(user);
            var expiresAt = _jwtTokenService.GetTokenExpiration(accessToken);

            var userDto = new UserDto(
                user.Id,
                user.Email!,
                user.UserName!,
                user.FirstName,
                user.LastName,
                user.Role,
                user.SubscriptionTier,
                user.IsActive,
                user.EmailConfirmed,
                user.CreatedAt,
                user.LastLoginAt);

            _logger.LogInformation("Successful login for user: {UserId}", user.Id);

            return Ok(new AuthResponse(
                true,
                "Login successful",
                accessToken,
                refreshToken,
                expiresAt,
                userDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for email: {Email}", request.Email);
            return StatusCode(500, new ErrorResponse(
                "An error occurred during login",
                "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            // Validate request
            var validator = new RefreshTokenRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new ErrorResponse(
                    "Validation failed",
                    AuthErrorCodes.InvalidInput,
                    validationResult.Errors.GroupBy(x => x.PropertyName)
                        .ToDictionary(g => g.Key, g => g.Select(x => x.ErrorMessage).ToArray())));
            }

            // Validate refresh token
            var userId = await _jwtTokenService.ValidateRefreshTokenAsync(request.RefreshToken);
            if (userId == null)
            {
                return Unauthorized(new ErrorResponse(
                    "Invalid or expired refresh token",
                    AuthErrorCodes.InvalidToken));
            }

            // Get user
            var user = await _userService.GetUserByIdAsync(userId.Value);
            if (user == null || !user.IsActive)
            {
                return Unauthorized(new ErrorResponse(
                    "User not found or inactive",
                    AuthErrorCodes.UserNotFound));
            }

            // Revoke old refresh token
            await _jwtTokenService.RevokeRefreshTokenAsync(request.RefreshToken);

            // Generate new tokens
            var accessToken = await _jwtTokenService.GenerateAccessTokenAsync(user);
            var refreshToken = await _jwtTokenService.GenerateRefreshTokenAsync(user);
            var expiresAt = _jwtTokenService.GetTokenExpiration(accessToken);

            var userDto = new UserDto(
                user.Id,
                user.Email!,
                user.UserName!,
                user.FirstName,
                user.LastName,
                user.Role,
                user.SubscriptionTier,
                user.IsActive,
                user.EmailConfirmed,
                user.CreatedAt,
                user.LastLoginAt);

            _logger.LogInformation("Token refreshed for user: {UserId}", user.Id);

            return Ok(new AuthResponse(
                true,
                "Token refreshed successfully",
                accessToken,
                refreshToken,
                expiresAt,
                userDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, new ErrorResponse(
                "An error occurred during token refresh",
                "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Request password reset email
    /// </summary>
    [HttpPost("forgot-password")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            // Validate request
            var validator = new ForgotPasswordRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new ErrorResponse(
                    "Validation failed",
                    AuthErrorCodes.InvalidInput,
                    validationResult.Errors.GroupBy(x => x.PropertyName)
                        .ToDictionary(g => g.Key, g => g.Select(x => x.ErrorMessage).ToArray())));
            }

            var user = await _userService.GetUserByEmailAsync(request.Email);
            if (user != null)
            {
                var resetToken = await _userService.GeneratePasswordResetTokenAsync(user.Id);
                
                // TODO: Send password reset email (will be implemented when email service is added)
                _logger.LogInformation("Password reset token generated for user {UserId}: {Token}", 
                    user.Id, resetToken);
            }

            // Always return success to prevent email enumeration
            return Ok(new SuccessResponse(
                true,
                "If an account with that email exists, a password reset link has been sent."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during forgot password for email: {Email}", request.Email);
            return StatusCode(500, new ErrorResponse(
                "An error occurred processing your request",
                "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Reset password using reset token
    /// </summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            // Validate request
            var validator = new ResetPasswordRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new ErrorResponse(
                    "Validation failed",
                    AuthErrorCodes.InvalidInput,
                    validationResult.Errors.GroupBy(x => x.PropertyName)
                        .ToDictionary(g => g.Key, g => g.Select(x => x.ErrorMessage).ToArray())));
            }

            var user = await _userService.GetUserByEmailAsync(request.Email);
            if (user == null)
            {
                return BadRequest(new ErrorResponse(
                    "Invalid reset request",
                    AuthErrorCodes.InvalidToken));
            }

            var result = await _userService.ResetPasswordAsync(user.Id, request.Token, request.NewPassword);
            if (!result.Succeeded)
            {
                return BadRequest(new ErrorResponse(
                    "Password reset failed",
                    AuthErrorCodes.InvalidToken,
                    new Dictionary<string, string[]>
                    {
                        ["general"] = result.Errors.Select(e => e.Description).ToArray()
                    }));
            }

            _logger.LogInformation("Password reset successful for user: {UserId}", user.Id);

            return Ok(new SuccessResponse(
                true,
                "Password has been reset successfully. You can now log in with your new password."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password reset for email: {Email}", request.Email);
            return StatusCode(500, new ErrorResponse(
                "An error occurred during password reset",
                "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Verify user email address
    /// </summary>
    [HttpPost("verify-email")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        try
        {
            // Validate request
            var validator = new VerifyEmailRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new ErrorResponse(
                    "Validation failed",
                    AuthErrorCodes.InvalidInput,
                    validationResult.Errors.GroupBy(x => x.PropertyName)
                        .ToDictionary(g => g.Key, g => g.Select(x => x.ErrorMessage).ToArray())));
            }

            var result = await _userService.ConfirmEmailAsync(request.UserId, request.Token);
            if (!result.Succeeded)
            {
                return BadRequest(new ErrorResponse(
                    "Email verification failed",
                    AuthErrorCodes.InvalidToken,
                    new Dictionary<string, string[]>
                    {
                        ["general"] = result.Errors.Select(e => e.Description).ToArray()
                    }));
            }

            _logger.LogInformation("Email verified successfully for user: {UserId}", request.UserId);

            return Ok(new SuccessResponse(
                true,
                "Email verified successfully. You can now log in to your account."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during email verification for user: {UserId}", request.UserId);
            return StatusCode(500, new ErrorResponse(
                "An error occurred during email verification",
                "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Logout user and revoke refresh token
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
    {
        try
        {
            if (!string.IsNullOrEmpty(request.RefreshToken))
            {
                await _jwtTokenService.RevokeRefreshTokenAsync(request.RefreshToken);
            }

            await _signInManager.SignOutAsync();

            _logger.LogInformation("User logged out successfully");

            return Ok(new SuccessResponse(
                true,
                "Logged out successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, new ErrorResponse(
                "An error occurred during logout",
                "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    [HttpGet("profile/{userId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfile(Guid userId)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new ErrorResponse(
                    "User not found",
                    AuthErrorCodes.UserNotFound));
            }

            var userDto = new UserDto(
                user.Id,
                user.Email!,
                user.UserName!,
                user.FirstName,
                user.LastName,
                user.Role,
                user.SubscriptionTier,
                user.IsActive,
                user.EmailConfirmed,
                user.CreatedAt,
                user.LastLoginAt);

            return Ok(userDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user profile for: {UserId}", userId);
            return StatusCode(500, new ErrorResponse(
                "An error occurred retrieving user profile",
                "INTERNAL_ERROR"));
        }
    }
}
