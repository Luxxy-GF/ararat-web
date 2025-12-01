"use client";

import React from "react";
import {
    IconBrandDebian,
    IconBrandUbuntu,
    IconBrandWindows,
    IconServer,
    IconBrandApple,
    IconBrandAndroid,
} from "@tabler/icons-react";

interface OSLogoProps {
    brand?: string | null;
    className?: string;
}

export function OSLogo({ brand, className }: OSLogoProps) {
    if (!brand) {
        return <IconServer className={className} />;
    }

    const normalizedBrand = brand.toLowerCase();

    if (normalizedBrand.includes("debian")) {
        return <IconBrandDebian className={className} />;
    }
    if (normalizedBrand.includes("ubuntu")) {
        return <IconBrandUbuntu className={className} />;
    }
    // Alpine, CentOS, Fedora, Arch don't have specific Tabler icons in this version.
    // We can use generic server icon or maybe find closest matches if available, 
    // but for now let's fallback to IconServer for them to avoid build errors.

    if (normalizedBrand.includes("windows")) {
        return <IconBrandWindows className={className} />;
    }
    if (normalizedBrand.includes("macos") || normalizedBrand.includes("apple")) {
        return <IconBrandApple className={className} />;
    }
    if (normalizedBrand.includes("android")) {
        return <IconBrandAndroid className={className} />;
    }

    return <IconServer className={className} />;
}
