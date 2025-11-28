import { Instance, InstanceState } from "../../instances/_lib/instances.d";

export function formatBytes(value?: number) {
    if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
        return "—";
    }
    const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
    if (value === 0) return "0 B";
    const exponent = Math.min(
        Math.max(Math.floor(Math.log(value) / Math.log(1024)), 0),
        units.length - 1
    );
    const num = value / Math.pow(1024, exponent);
    return `${num.toFixed(num >= 10 ? 0 : 1)} ${units[exponent]}`;
}

export function formatDate(value?: string) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

export function getRootDiskUsage(state?: InstanceState) {
    if (!state?.disk) return undefined;
    const rootDisk =
        state.disk["root"] ||
        state.disk["/"] ||
        Object.values(state.disk)[0] ||
        null;
    return rootDisk?.usage;
}

export function getNetworkDetails(instance: Instance) {
    const ipv4 = new Set<string>();
    const ipv6 = new Set<string>();
    const macs = new Set<string>();
    const network = instance.state?.network ?? {};
    Object.values(network).forEach((iface) => {
        iface.addresses?.forEach((address) => {
            if (!address.address) return;
            if (address.family === "inet") {
                ipv4.add(address.address);
            } else if (address.family === "inet6" && address.scope !== "link") {
                ipv6.add(address.address);
            }
        });
        if (iface.hwaddr) {
            macs.add(iface.hwaddr);
        }
    });
    return {
        ipv4: Array.from(ipv4),
        ipv6: Array.from(ipv6),
        macs: Array.from(macs),
    };
}

export function getBaseImage(instance: Instance) {
    return (
        instance.config?.["image.description"] ||
        instance.config?.["image.alias"] ||
        instance.config?.["image.os"] ||
        instance.expanded_config?.["volatile.base_image"] ||
        instance.config?.["volatile.base_image"] ||
        null
    );
}

export function getRootDiskPool(instance: Instance) {
    const rootDisk = instance.expanded_devices?.root || instance.devices?.root;
    return rootDisk?.pool ?? null;
}

export function calcUsagePercent(current?: number, peak?: number) {
    if (!peak || peak <= 0) {
        return 0;
    }
    return Math.min(100, Math.max(0, ((current ?? 0) / peak) * 100));
}
