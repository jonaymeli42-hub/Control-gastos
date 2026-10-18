package com.controlfinanzas.anotargasto;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
public final class NoteRules {
 public static boolean validId(String id){return id!=null&&id.matches("[A-Za-z0-9_-]{1,80}");}
 public static boolean validText(String text){return text!=null&&!text.trim().isEmpty()&&text.length()<=1000;}
 public static boolean validToken(String token){return token!=null&&token.matches("[A-Za-z0-9_-]{16,128}");}
 public static boolean sameToken(String expected,String actual){return validToken(expected)&&validToken(actual)&&MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),actual.getBytes(StandardCharsets.UTF_8));}
 public static String destination(String target){if("gastos".equals(target))return "Control Gastos";if("tarjetas".equals(target))return "Control Tarjetas";return "la app";}
}
