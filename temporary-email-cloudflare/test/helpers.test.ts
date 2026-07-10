import { describe, expect, it } from "vitest";
import { extractVerificationCode, htmlToPlainText, normalizeLocalPart, truncateUtf8 } from "../src/helpers";

describe("mail helpers", () => {
  it("normalizes an address to its local part", () => {
    expect(normalizeLocalPart("ABC234@temp.91mail.org")).toBe("abc234");
    expect(normalizeLocalPart("bad+alias")).toBeNull();
  });

  it("extracts contextual verification codes", () => {
    expect(extractVerificationCode("登录验证", "您的验证码是 482913，十分钟内有效")).toBe("482913");
    expect(extractVerificationCode("Security code: A7K29P", "Do not share it.")).toBe("A7K29P");
  });

  it("does not guess unrelated body numbers", () => {
    expect(extractVerificationCode("订单通知", "订单 123456 已发货")).toBeNull();
  });

  it("converts untrusted html to plain text", () => {
    const value = htmlToPlainText('<script>alert(1)</script><p>Hello&nbsp;<b>world</b></p><iframe src="x"></iframe>');
    expect(value).toBe("Hello world");
  });

  it("truncates by utf-8 bytes", () => {
    expect(truncateUtf8("你好世界", 6)).toBe("你好");
  });
});
