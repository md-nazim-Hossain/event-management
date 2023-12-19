import Image from "next/image";
import Link from "next/link";
import React from "react";

function Footer() {
  return (
    <footer className="border-t">
      <div className="flex-center wrapper flex-between flex flex-col p-5 text-center gap-5 sm:flex-row">
        <Link href={"/"}>
          <Image
            src={"/assets/images/logo.svg"}
            alt="Evem Logo"
            width={128}
            height={38}
          />
        </Link>
        <p>2023 Evem. All Rights reserved</p>
      </div>
    </footer>
  );
}

export default Footer;
