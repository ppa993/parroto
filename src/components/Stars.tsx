/** Soft Cloudline-style sky backdrop (kept as "Stars" so App import stays stable). */
export default function Stars() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Cream paper base */}
      <div className="absolute inset-0 bg-[#f4f0e6]" />

      {/* Soft sky wash */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,#d7e6ef_0%,transparent_55%),radial-gradient(ellipse_80%_60%_at_100%_20%,#e8dcc8_0%,transparent_45%),radial-gradient(ellipse_70%_50%_at_0%_80%,#dfe9d8_0%,transparent_50%)]" />

      {/* Gentle floating clouds */}
      <div className="cloud cloud-a absolute top-[8%] left-[-8%] h-40 w-[28rem] rounded-[100%] bg-white/55 blur-2xl" />
      <div className="cloud cloud-b absolute top-[22%] right-[-6%] h-48 w-[32rem] rounded-[100%] bg-white/45 blur-3xl" />
      <div className="cloud cloud-c absolute bottom-[18%] left-[10%] h-36 w-[24rem] rounded-[100%] bg-white/40 blur-2xl" />
      <div className="cloud cloud-d absolute top-[55%] right-[15%] h-28 w-[20rem] rounded-[100%] bg-[#e8f0e4]/50 blur-2xl" />

      {/* Soft horizon haze */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#e8e2d4]/90 to-transparent" />

      {/* Tiny warm dust motes */}
      <span className="mote absolute top-[18%] left-[12%] h-1.5 w-1.5 rounded-full bg-[#c4a574]/40" />
      <span className="mote absolute top-[30%] left-[72%] h-1 w-1 rounded-full bg-[#8fa88a]/50" style={{ animationDelay: '1.2s' }} />
      <span className="mote absolute top-[48%] left-[28%] h-1.5 w-1.5 rounded-full bg-[#c4a574]/30" style={{ animationDelay: '2.1s' }} />
      <span className="mote absolute top-[62%] left-[58%] h-1 w-1 rounded-full bg-[#8fa88a]/40" style={{ animationDelay: '0.6s' }} />
      <span className="mote absolute top-[14%] left-[48%] h-1 w-1 rounded-full bg-white/70" style={{ animationDelay: '1.8s' }} />
    </div>
  );
}
