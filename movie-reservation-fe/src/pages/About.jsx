import React from 'react';

const About = () => {
  return (
    <div className="flex-grow py-8 px-4 sm:px-6 max-w-5xl mx-auto w-full flex flex-col gap-8 font-sans">
      {/* Tiêu đề trang */}
      <div className="w-full text-center space-y-2 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
          Về chúng tôi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
          Hệ thống Rạp chiếu phim hiện đại mang lại trải nghiệm điện ảnh chân thực, văn minh và tiện lợi nhất.
        </p>
      </div>

      {/* Dồn toàn bộ nội dung vào chung 1 section duy nhất */}
      <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
        {/* Phần 1: Lịch sử hình thành & Sứ mệnh */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
            1. Lịch sử hình thành & Định hướng phát triển
          </h2>
          <div className="space-y-3 text-sm text-slate-700 leading-relaxed text-justify">
            <p>
              Hệ thống Rạp Chiếu Phim <strong>CineMind</strong> (tên thương hiệu quốc tế: <em>CineMind Cinema Complex</em>) chính thức được thành lập vào ngày{' '}
              <strong className="text-red-600 font-semibold">20/09/2026</strong>. Sự ra đời của CineMind khởi nguồn từ niềm đam mê vô tận với bộ môn nghệ thuật thứ bảy, cùng khát vọng kiến tạo một không gian thưởng thức điện ảnh văn minh, hiện đại và chuẩn mực dành cho mọi khán giả yêu phim.
            </p>
            <p>
              Ngay từ những ngày đầu vận hành, CineMind luôn kiên định với tôn chỉ lấy trải nghiệm của khán giả làm trung tâm. Rạp không ngừng đầu tư đồng bộ hệ thống máy chiếu độ phân giải cao, màn hình cong cực đại, cùng công nghệ âm thanh vòm Dolby Digital sống động mang đến hiệu ứng thị giác và thính giác đa chiều chân thực. Bên cạnh đó, giải pháp chuyển đổi số và cổng đặt vé trực tuyến thông minh giúp người xem dễ dàng tra cứu lịch chiếu, lựa chọn vị trí ngồi ưa thích và thanh toán chỉ trong vài bước thao tác.
            </p>
            <p>
              Với phương châm <em>"Điện ảnh kết nối tâm hồn"</em>, CineMind tự hào là điểm hẹn văn hóa thân thuộc, nơi gắn kết gia đình, bạn bè và những tâm hồn đồng điệu qua từng thước phim sống động vào mỗi dịp cuối tuần và lễ tết.
            </p>
          </div>
        </div>

        {/* Phần 2: Cơ sở vật chất & Không gian rạp */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
            2. Cơ sở vật chất & Không gian phòng chiếu
          </h2>
          <div className="space-y-3 text-sm text-slate-700 leading-relaxed text-justify">
            <p>
              Cụm rạp CineMind được thiết kế theo phong cách kiến trúc đương đại kết hợp tinh tế cùng không gian ánh sáng sang trọng. Toàn bộ các phòng chiếu đều đạt tiêu chuẩn quốc tế nghiêm ngặt về độ cách âm, khoảng cách ghế ngồi và góc nhìn tối ưu từ mọi vị trí.
            </p>
            <p>
              Hệ thống ghế bọc nỉ công thái học êm ái, hàng ghế VIP với tầm nhìn trung tâm hoàn hảo và dãy ghế đôi (Couple Sweetbox) riêng tư, ấm cúng mang lại sự thoải mái tuyệt đối trong suốt thời gian thưởng thức bộ phim.
            </p>
          </div>

          {/* Bộ ảnh minh họa không gian rạp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 aspect-video">
                <img
                  src="/images/about/cinema_auditorium.jpg"
                  alt="Không gian phòng chiếu CineMind"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-center text-slate-500 italic">
                Không gian phòng chiếu tiêu chuẩn với màn chiếu cong và hệ thống ghế ngồi cao cấp
              </p>
            </div>

            <div className="space-y-2">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 aspect-video">
                <img
                  src="/images/about/cinema_lobby.jpg"
                  alt="Sảnh chờ CineMind"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-center text-slate-500 italic">
                Khu vực sảnh đón tiếp và phòng chờ ấm cúng dành cho khán giả
              </p>
            </div>
          </div>
        </div>

        {/* Phần 3: Hoạt động & Dịch vụ */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
            3. Hoạt động & Lĩnh vực phục vụ
          </h2>
          
          <div className="space-y-4 text-sm text-slate-700">
            <div>
              <h3 className="font-bold text-slate-900 mb-2">
                a. Hoạt động chiếu phim & Văn hóa điện ảnh
              </h3>
              <ul className="list-disc list-inside space-y-1.5 pl-2 leading-relaxed text-slate-600">
                <li>Trình chiếu các tác phẩm điện ảnh xuất sắc, phim bom tấn thế giới và phim điện ảnh Việt Nam với các định dạng 2D, 3D kỹ thuật số đỉnh cao.</li>
                <li>Phối hợp tổ chức các tuần lễ phim, liên hoan phim quốc gia và giao lưu văn hóa quốc tế.</li>
                <li>Tổ chức các suất chiếu sớm (Sneak Show), sự kiện họp báo và công chiếu ra mắt phim độc quyền.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">
                b. Dịch vụ tiện ích & Sự kiện
              </h3>
              <ul className="list-disc list-inside space-y-1.5 pl-2 leading-relaxed text-slate-600">
                <li>Cung cấp dịch vụ đặt vé phim và bắp nước trực tuyến 24/7 thông qua website và ứng dụng di động.</li>
                <li>Quầy dịch vụ ẩm thực Concession đạt chuẩn an toàn vệ sinh thực phẩm với đa dạng hương vị bắp rang bơ và đồ uống hấp dẫn.</li>
                <li>Dịch vụ tổ chức sự kiện, hội nghị, hội thảo, đào tạo doanh nghiệp và cho thuê phòng chiếu theo hợp đồng trọn gói.</li>
                <li>Tổ chức các suất chiếu chuyên biệt, hợp đồng đoàn thể dành cho trường học, cơ quan, doanh nghiệp với mức ưu đãi đặc biệt.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Phần 4: Thông tin liên hệ (Trình bày dạng văn bản thường, thuần text theo mẫu) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
            4. Thông tin liên hệ
          </h2>
          
          <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <p>Ngày thành lập: 20/09/2026</p>
            <p>Trụ sở: 87 Láng Hạ, Phường Ô Chợ Dừa, Thành phố Hà Nội.</p>
            <p>Website: www.cinemind.vn</p>
            <p>Email: support@cinemind.vn</p>
            <p>Số điện thoại: 024.3514 1791 / 024.3514 8647</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
