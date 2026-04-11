package com.example.wearwise.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private final JavaMailSender mailSender;

    /** Injected from spring.mail.username so the "From" address always matches the SMTP account. */
    @Value("${spring.mail.username}")
    private String fromEmail;

    // In-memory OTP store: normalised email ─► {otp, expiresAt}
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    private static final int  OTP_LENGTH       = 6;
    private static final long OTP_VALID_MILLIS = 10 * 60 * 1000L; // 10 minutes

    public OtpService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ── Generate & send OTP ─────────────────────────────────────────────────
    public void sendOtp(String email) {
        String key = email.toLowerCase();
        String otp = generateOtp();
        otpStore.put(key, new OtpEntry(otp, Instant.now().plusMillis(OTP_VALID_MILLIS)));

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(email);
        message.setSubject("WearWise — Your Verification Code");
        message.setText(
                "Hi there!\n\n" +
                        "Your WearWise email verification code is:\n\n" +
                        "        " + otp + "\n\n" +
                        "This code expires in 10 minutes.\n" +
                        "If you didn't request this, you can safely ignore this email.\n\n" +
                        "— The WearWise Team"
        );

        mailSender.send(message);
    }

    // ── Verify OTP (single-use) ──────────────────────────────────────────────
    public boolean verifyOtp(String email, String otp) {
        String key   = email.toLowerCase();
        OtpEntry entry = otpStore.get(key);

        if (entry == null) return false;

        if (Instant.now().isAfter(entry.expiresAt())) {
            otpStore.remove(key);
            return false;
        }

        if (!entry.otp().equals(otp.trim())) return false;

        // Valid — remove immediately (OTP is single-use)
        otpStore.remove(key);
        return true;
    }

    // ── Private helpers ─────────────────────────────────────────────────────
    private String generateOtp() {
        SecureRandom rng = new SecureRandom();
        StringBuilder sb = new StringBuilder(OTP_LENGTH);
        for (int i = 0; i < OTP_LENGTH; i++) sb.append(rng.nextInt(10));
        return sb.toString();
    }

    private record OtpEntry(String otp, Instant expiresAt) {}
}