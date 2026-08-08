import { describe, expect, it } from "vitest";
import { getImageSrc } from "@/app/lib/images";

describe("getImageSrc", () => {
  it("injects Cloudinary transforms before the version segment", () => {
    expect(
      getImageSrc(
        "https://res.cloudinary.com/demo/image/upload/v1786006711/styleshop/products/hat.jpg"
      )
    ).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_1200,q_auto,f_auto/v1786006711/styleshop/products/hat.jpg"
    );
  });

  it("does not double-apply transforms", () => {
    const already =
      "https://res.cloudinary.com/demo/image/upload/w_1200,q_auto,f_auto/v1/hat.jpg";
    expect(getImageSrc(already)).toBe(already);
  });

  it("prefixes local filenames", () => {
    expect(getImageSrc("hat.jpg")).toBe("/hat.jpg");
  });
});
