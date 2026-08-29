import { ExternalLink, Github, Heart, Linkedin, Mail, MapPin, Twitter } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-10 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

          {/* Section 1: Brand & Developer Credit */}
          <div className="md:col-span-5">
            <h5 className="text-1xl font-black text-[#1e2432] tracking-tighter mb-4">
              University <span className="text-[#1e2432]">QuizPro</span>
            </h5>
            <p className="text-slate-500 font-medium leading-relaxed max-w-sm mb-6">
              Empowering academic excellence through secure, smart, and scalable assessment technology. Built for the future of education.
            </p>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest  w-fit py-2 rounded-xl">
              <span>Developed by</span>
              <span className="text-[#544bfa]">RAJ DEY</span>
            </div>
          </div>

          {/* Section 2: Platform Links */}
          <div className="md:col-span-2">
            <h4 className="text-[#1e2432] font-black uppercase tracking-widest text-[10px] mb-8">Platform</h4>
            <ul className="space-y-4">
              {['Assessments', 'Dashboard', 'Security', 'Privacy'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-500 font-bold text-sm hover:text-[#544bfa] transition-colors flex items-center gap-2 group">
                    {item}
                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3: Support Links */}
          <div className="md:col-span-2">
            <h4 className="text-[#1e2432] font-black uppercase tracking-widest text-[10px] mb-8">Support</h4>
            <ul className="space-y-4 font-bold text-sm text-slate-500">
              <li><a href="#" className="hover:text-[#544bfa] transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-[#544bfa] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#544bfa] transition-colors">Student Guide</a></li>
            </ul>
          </div>

          {/* Section 4: Contact & Socials */}
          <div className="md:col-span-3">
            <h4 className="text-[#1e2432] font-black uppercase tracking-widest text-[10px] mb-8">Connect</h4>
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                <Mail size={16} className="text-[#544bfa]" /> rajdey.btcs@adtu.in
              </div>
              <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                <MapPin size={16} className="text-[#544bfa]" /> Guwahati, Assam
              </div>
            </div>

            {/* Social Media Row: Moved here and updated */}
            <div className="flex items-center gap-3">
              <a href="https://www.linkedin.com/in/raj-dey-320422292/" target="_blank" className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#544bfa] hover:text-white transition-all">
                <Linkedin size={18} />
              </a>
              <a href="https://github.com/raj-dey" target="_blank" className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#544bfa] hover:text-white transition-all">
                <Github size={18} />
              </a>
              <a href="https://x.com/rajdey1313" target="_blank" className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#544bfa] hover:text-white transition-all">
                <Twitter size={18} />
              </a>
              <a href="mailto:rajdey.btcs@adtu.in" target="_blank" className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#544bfa] hover:text-white transition-all">
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Centered Copyright Footer */}
        <div className="pt-10 border-t border-slate-50 flex flex-col items-center gap-4 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
            © {currentYear} QUIZPRO SYSTEM • All Rights Reserved
          </p>
          <div className="flex items-center gap-1.5 text-slate-300 text-[10px] font-bold uppercase">
            <span>Made with</span>
            <Heart size={10} className="text-red-400 fill-red-400" />
            <span>for academic excellence</span>
          </div>
        </div>
      </div>
    </footer>
  );
}