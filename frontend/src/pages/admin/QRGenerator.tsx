import { QRCodeSVG } from 'qrcode.react';
import { VENDOR_NAMES, VENDOR_LOCATIONS } from '../../lib/constants';

const VENDORS = [
  { id: '11111111-1111-1111-1111-111111111101', name: VENDOR_NAMES.MAYURI_AB, loc: VENDOR_LOCATIONS[VENDOR_NAMES.MAYURI_AB] },
  { id: '11111111-1111-1111-1111-111111111102', name: VENDOR_NAMES.MAYURI_SB, loc: VENDOR_LOCATIONS[VENDOR_NAMES.MAYURI_SB] },
  { id: '11111111-1111-1111-1111-111111111103', name: VENDOR_NAMES.UNDERBELLY, loc: VENDOR_LOCATIONS[VENDOR_NAMES.UNDERBELLY] },
  { id: '11111111-1111-1111-1111-111111111104', name: VENDOR_NAMES.DAKSHIN, loc: VENDOR_LOCATIONS[VENDOR_NAMES.DAKSHIN] },
  { id: '11111111-1111-1111-1111-111111111105', name: VENDOR_NAMES.BISTRO, loc: VENDOR_LOCATIONS[VENDOR_NAMES.BISTRO] },
];

export default function QRGenerator() {
  const baseUrl = window.location.origin;

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">VITeBites — Counter QR Standees</h1>
            <p className="text-sm text-gray-600">Printable high-resolution QR codes for all 5 campus cafes</p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md cursor-pointer hover:bg-primary-dark"
          >
            🖨️ Print Standees
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-6">
          {VENDORS.map(vendor => {
            const qrUrl = `${baseUrl}/order?vendor=${vendor.id}`;

            return (
              <div
                key={vendor.id}
                className="bg-white rounded-3xl p-6 border-4 border-primary text-center shadow-lg flex flex-col items-center justify-between print:break-inside-avoid"
              >
                <div>
                  <span className="text-4xl mb-1 block">🍽️</span>
                  <h2 className="text-xl font-black text-gray-900 leading-tight">VITe<span className="text-primary">Bites</span></h2>
                  <p className="text-xs font-semibold text-gray-500 mb-4">{vendor.loc}</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border-2 border-primary/20 shadow-inner mb-4">
                  <QRCodeSVG
                    value={qrUrl}
                    size={180}
                    level="H"
                    includeMargin
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-lg font-black text-primary-dark">{vendor.name}</p>
                  <p className="text-xs font-bold text-gray-700">SCAN TO ORDER & SKIP THE QUEUE</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">{qrUrl}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
