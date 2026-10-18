import com.controlfinanzas.anotargasto.NoteRules;
public class NoteRulesTest {
 static void check(boolean yes){if(!yes)throw new AssertionError();}
 public static void main(String[] args){check(NoteRules.validId("android_123e4567-e89b-12d3-a456-426614174000"));check(!NoteRules.validId("../other"));check(NoteRules.validText("6700 en el kiosco"));check(!NoteRules.validText(" "));check(NoteRules.sameToken("test-token-1234567890","test-token-1234567890"));check(!NoteRules.sameToken("test-token-1234567890","test-token-9999999999"));check(!NoteRules.sameToken("test-token-1234567890",null));check("Control Tarjetas".equals(NoteRules.destination("tarjetas")));System.out.println("Native note IDs, text, receipt token validation: passed");}
}
