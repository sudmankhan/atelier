import { useEffect, useMemo, useRef, useState } from "react";
import modelViewerScript from "@google/model-viewer/dist/model-viewer.min.js?url";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { StudioShell } from "@/components/three/StudioCanvas";
import { SpecModel } from "@/components/three/SpecModel";
import { arModesForSource, makeARLink } from "@/lib/furniture/arLink";
import { exportSpecGlb } from "@/lib/furniture/exportGlb";
import type { FurnitureSpec } from "@/lib/furniture/spec";

type ModelViewerElement = HTMLElement & { canActivateAR: boolean; loaded: boolean };

function PhoneQR({ url }: { url: string }) {
  const [image, setImage] = useState<string>();
  useEffect(() => {
    let active = true;
    import("qrcode")
      .then(({ default: QRCode }) => QRCode.toDataURL(url, { width: 176, margin: 1 }))
      .then((data) => {
        if (active) setImage(data);
      })
      .catch(() => {
        /* The link below still works when canvas QR generation fails. */
      });
    return () => {
      active = false;
    };
  }, [url]);
  return (
    <div className="flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
      {image && (
        <img
          src={image}
          alt="Scan to open this chair at its current size on your phone"
          width={176}
          height={176}
          className="rounded-md border border-border bg-white p-1"
        />
      )}
      <p>Scan to open this size on your phone.</p>
      <a href={url} className="max-w-full break-all text-teal underline">
        Open the chair link
      </a>
    </div>
  );
}

export function ARModal({
  spec,
  saved,
  onClose,
}: {
  spec: FurnitureSpec;
  saved: boolean;
  onClose: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string>();
  const [failure, setFailure] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [canAR, setCanAR] = useState(false);
  const viewer = useRef<ModelViewerElement | null>(null);
  const link = useMemo(() => makeARLink(window.location.href, spec), [spec]);

  useEffect(() => {
    let active = true;
    let url: string | undefined;
    const timeout = window.setTimeout(() => {
      if (active) setFailure(true);
    }, 25_000);
    // Import the browser bundle by URL. A normal package import can be hoisted into
    // TanStack/Nitro's server chunks, where model-viewer's `self` access crashes SSR.
    Promise.all([import(/* @vite-ignore */ modelViewerScript), exportSpecGlb(spec)])
      .then(([, glb]) => {
        if (!active) return;
        url = URL.createObjectURL(glb);
        setBlobUrl(url);
      })
      .catch(() => {
        if (active) setFailure(true);
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      active = false;
      window.clearTimeout(timeout);
      if (url) URL.revokeObjectURL(url);
    };
  }, [spec]);

  useEffect(() => {
    if (!blobUrl || failure) return;
    const el = viewer.current;
    if (!el) return;
    const onLoad = () => setLoaded(true);
    const onError = () => setFailure(true);
    const onARStatus = (event: Event) => {
      if ((event as CustomEvent<{ status: string }>).detail?.status === "failed") setFailure(true);
    };
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    el.addEventListener("ar-status", onARStatus);
    const status = window.setInterval(() => setCanAR(el.canActivateAR), 500);
    const loading = window.setTimeout(() => {
      if (!el.loaded) setFailure(true);
    }, 20_000);
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
      el.removeEventListener("ar-status", onARStatus);
      window.clearInterval(status);
      window.clearTimeout(loading);
    };
  }, [blobUrl, failure]);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex h-dvh max-h-dvh max-w-none flex-col gap-3 overflow-y-auto rounded-none p-4 sm:h-[min(94dvh,800px)] sm:max-w-xl sm:rounded-xl sm:p-5">
        <div className="pr-9">
          <DialogTitle className="font-serif text-xl">View in your room</DialogTitle>
          <DialogDescription className="mt-1">
            Turn the chair or place it on your floor at the size you set.
          </DialogDescription>
        </div>
        <div className="relative min-h-[260px] flex-1 overflow-hidden rounded-lg bg-[#F1ECE3]">
          {failure ? (
            <StudioShell initial="three">
              <SpecModel spec={spec} />
            </StudioShell>
          ) : blobUrl ? (
            <model-viewer
              ref={viewer}
              src={blobUrl}
              alt={`${spec.name} at your chosen size`}
              ar
              ar-modes={arModesForSource(blobUrl)}
              ar-placement="floor"
              ar-scale="fixed"
              camera-controls
              auto-rotate
              className="h-full min-h-[260px] w-full"
            >
              <button
                slot="ar-button"
                type="button"
                className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-teal px-5 py-3 text-sm font-medium text-white shadow-lg"
              >
                Place it on my floor
              </button>
            </model-viewer>
          ) : (
            <div className="flex h-full min-h-[260px] items-center justify-center text-sm text-muted-foreground">
              Preparing your chair…
            </div>
          )}
        </div>
        {failure && (
          <p role="status" className="text-center text-sm text-walnut">
            AR isn’t available on this device. You can still turn the chair above.
          </p>
        )}
        {!failure && loaded && !canAR && (
          <p role="status" className="text-center text-sm text-muted-foreground">
            AR isn’t available on this device. You can still turn the chair above.
          </p>
        )}
        {saved ? (
          <p className="text-center text-xs text-muted-foreground">
            AR works on the device where this design is saved.
          </p>
        ) : !canAR || failure ? (
          <PhoneQR url={link} />
        ) : null}
        <p className="text-center text-xs text-muted-foreground">
          Works on the live site, not localhost.
        </p>
      </DialogContent>
    </Dialog>
  );
}
