package com.example.missingpersons.service;

import com.example.missingpersons.model.MatchedPerson;
import com.example.missingpersons.model.MissingPerson;
import com.example.missingpersons.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import java.util.Base64;


@Service
@Slf4j
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;
    @Value("${app.domain.url}")
    private String domainUrl;
    public void sendMatchNotificationEmail(MissingPerson missingPerson, User comparingUser, double similarity, byte[] comparedImage,byte[] matchedFullImage) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(fromEmail);
            helper.setTo(missingPerson.getReportedBy().getEmail());
            helper.setSubject("Match Alert: Potential Match Found for " + missingPerson.getName());

            String emailContent = buildEmailContent(missingPerson, comparingUser, similarity);
            helper.setText(emailContent, true);

            helper.addAttachment("original_image.jpg", new ByteArrayResource(missingPerson.getImageData()));
            helper.addAttachment("compared_image.jpg", new ByteArrayResource(comparedImage));
            helper.addAttachment("matched_face.jpg", new ByteArrayResource(matchedFullImage));

            mailSender.send(message);
            log.info("Match notification email sent to {}", missingPerson.getReportedBy().getEmail());
        } catch (MessagingException e) {
            log.error("Failed to send match notification email", e);
            throw new RuntimeException("Email sending failed", e);
        }
    }

    private String buildEmailContent(MissingPerson missingPerson, User comparingUser, double similarity) {
        StringBuilder htmlBuilder = new StringBuilder();
        htmlBuilder.append("<html>")
                .append("<body style=\"font-family: Arial, sans-serif; padding: 20px;\">")
                .append("<h2 style=\"color: #2c3e50;\">Potential Match Alert</h2>")
                .append("<p>Dear ").append(missingPerson.getReportedBy().getName()).append(",</p>")
                .append("<p>We have identified a potential match for <strong>").append(missingPerson.getName()).append("</strong>.</p>")
                .append("<div style=\"background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;\">")
                .append("<h3 style=\"color: #2c3e50;\">Match Details:</h3>")
                .append("<ul style=\"list-style-type: none; padding-left: 0;\">")
                .append("<li>🔍 Compared by: <strong>").append(comparingUser.getName()).append("</strong></li>")
                .append("<li>📧 Comparer's Email: <strong>").append(comparingUser.getEmail()).append("</strong></li>")
                .append("<li>📊 Similarity Score: <strong>").append(String.format("%.2f%%", similarity)).append("</strong></li>")
                .append("</ul>")
                .append("</div>")
                .append("<p>Both the original and compared images are attached for your review.You can login to the application and Approve or Reject the match in the Reported Person Tab</p>")
                .append("<p style=\"margin-top: 30px;\">Best regards,<br/>")
                .append("<strong>TraceBack Team</strong></p>")
                .append("</body>")
                .append("</html>");

        return htmlBuilder.toString();
    }

    public void sendVerificationCode(String to, String verificationCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("TraceBack: Password Reset Verification Code");

            String emailContent = buildVerificationEmailContent(verificationCode);
            helper.setText(emailContent, true);

            mailSender.send(message);
            log.info("Verification code email sent to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send verification code email", e);
            throw new RuntimeException("Email sending failed", e);
        }
    }

    private String buildVerificationEmailContent(String verificationCode) {
        StringBuilder htmlBuilder = new StringBuilder();
        htmlBuilder.append("<html>")
                .append("<body style=\"font-family: Arial, sans-serif; padding: 20px;\">")
                .append("<div style=\"max-width: 600px; margin: 0 auto;\">")
                .append("<h2 style=\"color: #2c3e50;\">Password Reset Verification</h2>")
                .append("<div style=\"background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;\">")
                .append("<h3 style=\"color: #2c3e50;\">Your Verification Code:</h3>")
                .append("<div style=\"background-color: #ffffff; padding: 20px; text-align: center; border-radius: 5px;\">")
                .append("<h1 style=\"color: #2196F3; letter-spacing: 5px;\">").append(verificationCode).append("</h1>")
                .append("</div>")
                .append("<ul style=\"list-style-type: none; padding-left: 0;\">")
                .append("<li>🔒 Code expires in 15 minutes</li>")
                .append("<li>⚠️ Never share this code with anyone</li>")
                .append("<li>📱 Use this code to reset your password</li>")
                .append("</ul>")
                .append("</div>")
                .append("<p style=\"margin-top: 30px;\">Best regards,<br/>")
                .append("<strong>TraceBack Team</strong></p>")
                .append("</div>")
                .append("</body>")
                .append("</html>");

        return htmlBuilder.toString();
    }    public void sendNewMissingPersonNotification(MissingPerson missingPerson, User reportedBy) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(fromEmail);
            helper.setTo(reportedBy.getEmail());
            helper.setSubject("Missing Person Report Confirmation: " + missingPerson.getName());

            String emailContent = buildNewMissingPersonEmailContent(missingPerson, reportedBy);
            helper.setText(emailContent, true);

            // Attach the reported person's image
            helper.addAttachment("reported_person.jpg", new ByteArrayResource(missingPerson.getImageData()));

            mailSender.send(message);
            log.info("Missing person report confirmation email sent to {}", reportedBy.getEmail());
        } catch (MessagingException e) {
            log.error("Failed to send missing person report confirmation email", e);
            throw new RuntimeException("Email sending failed", e);
        }
    }

    private String buildNewMissingPersonEmailContent(MissingPerson missingPerson, User reportedBy) {
        StringBuilder htmlBuilder = new StringBuilder();
        htmlBuilder.append("<html>")
                .append("<body style=\"font-family: Arial, sans-serif; padding: 20px;\">")
                .append("<h2 style=\"color: #2c3e50;\">Missing Person Report Confirmation</h2>")
                .append("<p>Dear ").append(reportedBy.getName()).append(",</p>")
                .append("<p>Your missing person report for <strong>").append(missingPerson.getName()).append("</strong> has been successfully registered in our system.</p>")
                .append("<div style=\"background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;\">")
                .append("<h3 style=\"color: #2c3e50;\">Important Next Steps:</h3>")
                .append("<ul style=\"list-style-type: none; padding-left: 0;\">")
                .append("<li>🔔 Monitor community comments for potential leads</li>")
                .append("<li>🔄 Check your dashboard regularly for updates in the Reported Person Tab</li>")
                .append("<li>📱 Share the profile link: <strong>").append(domainUrl).append("/missing-persons/").append(missingPerson.getId()).append("</strong></li>")
                .append("<li>📍 Location reported: <strong>").append(missingPerson.getLocation()).append("</strong></li>")
                .append("</ul>")
                .append("</div>")
                .append("<p>The reported person's photo is attached to this email for your reference.</p>")
                .append("<p style=\"color: #2c3e50;\">We understand this is a challenging time. Our community is dedicated to helping find and you can share the missing person profile to others ").append(missingPerson.getName()).append(".</p>")
                .append("<p style=\"margin-top: 30px;\">With hope,<br/>")
                .append("<strong>TraceBack Team</strong></p>")
                .append("</body>")
                .append("</html>");

        return htmlBuilder.toString();
    }
    public void sendFoundPersonNotification(
            String commenterEmail,
            MissingPerson person,
            MatchedPerson matchedPerson,
            String message
    ) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);

            helper.setFrom(fromEmail);
            helper.setTo(commenterEmail);
            if (message.contains("Thank you for helping find")) {
                helper.setSubject("Thank You for Finding " + person.getName() + " - Your Help Made a Difference!");
            }
            else if (message.contains("We're delighted to confirm ")) {
                helper.setSubject("Great News! " + person.getName() + " Has Been Found Safe");
            }
            else {
                helper.setSubject("Community Update: " + person.getName() + " Has Been Found");
            }

            // Add image attachment
            helper.addAttachment("missed_person.jpg", new ByteArrayResource(person.getImageData()));

            String emailContent = buildFoundPersonEmailContent(person, matchedPerson,message);
            helper.setText(emailContent, true);

            mailSender.send(mimeMessage);
            log.info("Found person notification email sent to {}", commenterEmail);
        } catch (MessagingException e) {
            log.error("Failed to send found person notification email", e);
            throw new RuntimeException("Email sending failed", e);
        }
    }

    private String buildFoundPersonEmailContent(MissingPerson person,MatchedPerson matchedPerson, String message) {
        StringBuilder htmlBuilder = new StringBuilder();
        htmlBuilder.append("<html>")
                .append("<body style=\"font-family: Arial, sans-serif; padding: 20px;\">")
                .append("<h2 style=\"color: #2ecc71;\">").append(message).append("</h2>")
                .append("<div style=\"background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;\">")
                .append("<h3 style=\"color: #2c3e50;\">Case Details:</h3>")
                .append("<ul style=\"list-style-type: none; padding-left: 0;\">")
                .append("<li>👤 Person Found: <strong>").append(person.getName()).append("</strong></li>")
                .append("<li>📅 Reported By: <strong>").append(matchedPerson.getReportedBy().getName()).append("</strong></li>")
                .append("<li>✨ Found By: <strong>").append(matchedPerson.getFoundBy().getName()).append("</strong></li>")
                .append("<li>📝 Found Date: <strong>").append(matchedPerson.getMatchedAt()).append("</strong></li>")
                .append("</ul>")
                .append("</div>")
                .append("<p style='color: #7f8c8d; margin-top: 20px;'>Thank you for your involvement in helping locate missing persons." +
                        "\n You can find more details in Success Stories tab</p>")
                .append("<hr style='border: 1px solid #eee; margin: 20px 0;'>")
                .append("<p style=\"margin-top: 30px;\">Best regards,<br/>")
                .append("<strong>TraceBack Team</strong></p>")
                .append("</body>")
                .append("</html>");

        return htmlBuilder.toString();
    }


}


