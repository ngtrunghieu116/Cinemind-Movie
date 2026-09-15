import React from 'react';

const TicketPrices = () => {
  return (
    <div className="flex-grow py-8 px-4 sm:px-6 max-w-5xl mx-auto w-full flex flex-col gap-8 font-sans">
      {/* Tiêu đề trang */}
      <div className="w-full text-center space-y-2 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
          Bảng Giá Vé Xem Phim
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
          Quy định biểu giá vé và các chính sách ưu đãi xem phim áp dụng thống nhất trên toàn hệ thống cụm rạp CineMind.
        </p>
      </div>

      {/* Dồn toàn bộ nội dung vào chung 1 section duy nhất */}
      <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
        {/* Phần 1: Bảng giá vé 2D */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-wide">
              1. Bảng giá vé phim 2D
            </h2>
            <span className="text-xs text-slate-500 italic">
              Đơn vị tính: Việt Nam Đồng (VNĐ)
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-3.5 px-4 border-b border-slate-800">Khung Giờ Chiếu</th>
                  <th className="py-3.5 px-4 border-b border-slate-800 text-center">Ghế Tiêu Chuẩn (Standard)</th>
                  <th className="py-3.5 px-4 border-b border-slate-800 text-center">Ghế VIP</th>
                  <th className="py-3.5 px-4 border-b border-slate-800 text-center">Ghế Đôi (Couple)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr className="bg-slate-100/80 font-bold text-slate-900">
                  <td colSpan={4} className="py-2.5 px-4 uppercase tracking-wider text-xs bg-slate-100">
                    Thứ 2, Thứ 4, Thứ 5 (Ngày Thường)
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium">Suất trước 12:00</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">50.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-600">55.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">110.000 đ</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium">Suất từ 12:00 đến trước 17:00</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">65.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-600">70.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">140.000 đ</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium">Suất từ 17:00 đến trước 23:00 (Khung giờ vàng)</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">75.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-600">80.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">160.000 đ</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium">Suất từ 23:00 trở đi (Suất khuya)</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">60.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-600">65.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">130.000 đ</td>
                </tr>

                <tr className="bg-red-50/80 font-bold text-red-900">
                  <td colSpan={4} className="py-2.5 px-4 uppercase tracking-wider text-xs bg-red-50 text-red-700">
                    Thứ 3 Vui Vẻ (Happy Day - Đồng Giá Ưu Đãi)
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium">Tất cả các suất chiếu trước 17:00</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">50.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-600">55.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">110.000 đ</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium">Tất cả các suất chiếu từ 17:00 trở đi</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">60.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-600">65.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">130.000 đ</td>
                </tr>

                <tr className="bg-slate-100/80 font-bold text-slate-900">
                  <td colSpan={4} className="py-2.5 px-4 uppercase tracking-wider text-xs bg-slate-100">
                    Thứ 6, Thứ 7, Chủ Nhật & Ngày Nghỉ Lễ, Tết
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium">Suất trước 12:00</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">65.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-600">70.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">140.000 đ</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium">Suất từ 12:00 đến trước 17:00</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">80.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-600">85.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">170.000 đ</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium">Suất từ 17:00 đến trước 23:00 (Khung giờ vàng cuối tuần)</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">85.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-600">90.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">180.000 đ</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium">Suất từ 23:00 trở đi (Suất khuya cuối tuần)</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">70.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-600">75.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">150.000 đ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Phần 2: Bảng giá vé 3D */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-wide">
              2. Bảng giá vé phim 3D
            </h2>
            <span className="text-xs text-slate-500 italic">
              Đơn vị tính: Việt Nam Đồng (VNĐ)
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-3.5 px-4 border-b border-slate-800">Khung Giờ Chiếu</th>
                  <th className="py-3.5 px-4 border-b border-slate-800 text-center">Ghế Tiêu Chuẩn (Standard)</th>
                  <th className="py-3.5 px-4 border-b border-slate-800 text-center">Ghế VIP</th>
                  <th className="py-3.5 px-4 border-b border-slate-800 text-center">Ghế Đôi (Couple)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr className="bg-slate-100/80 font-bold text-slate-900">
                  <td colSpan={4} className="py-2.5 px-4 uppercase tracking-wider text-xs bg-slate-100">
                    Từ Thứ 2 Đến Thứ 5
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium">Suất trước 12:00</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">70.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-600">75.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">150.000 đ</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium">Suất từ 12:00 đến trước 17:00</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">85.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-600">90.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">180.000 đ</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium">Suất từ 17:00 trở đi</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">95.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-600">100.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">200.000 đ</td>
                </tr>

                <tr className="bg-slate-100/80 font-bold text-slate-900">
                  <td colSpan={4} className="py-2.5 px-4 uppercase tracking-wider text-xs bg-slate-100">
                    Thứ 6, Thứ 7, Chủ Nhật & Ngày Nghỉ Lễ, Tết
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium">Suất trước 12:00</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">85.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-600">90.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">180.000 đ</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium">Suất từ 12:00 đến trước 17:00</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">100.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-600">105.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">210.000 đ</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium">Suất từ 17:00 trở đi</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">110.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-red-600">115.000 đ</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">230.000 đ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Phần 3: Chính sách đối tượng ưu tiên */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
            3. Giá vé đối với các đối tượng khán giả ưu tiên
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 italic">
            Áp dụng khi trực tiếp sử dụng dịch vụ xem phim tại cụm rạp CineMind
          </p>

          <div className="space-y-4 text-sm text-slate-700">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">Mức giảm giá quy định:</h3>
              <ul className="list-disc list-inside space-y-1.5 pl-2 leading-relaxed">
                <li>
                  Giảm 20% giá vé theo quy định đối với: Trẻ em (người dưới 16 tuổi), người cao tuổi (công dân Việt Nam từ đủ 60 tuổi trở lên), người có công với cách mạng, người có hoàn cảnh đặc biệt khó khăn.
                </li>
                <li>
                  Giảm 50% giá vé theo quy định đối với: Người khuyết tật nặng.
                </li>
                <li>
                  Giảm giá vé 100% (miễn phí vé) đối với: Người khuyết tật đặc biệt nặng, trẻ em dưới 0.7m đi kèm với người lớn.
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="font-bold text-slate-900">Điều kiện áp dụng:</h3>
              <ul className="list-disc list-inside space-y-1.5 pl-2 leading-relaxed text-slate-600">
                <li>Chỉ áp dụng khi mua vé trực tiếp tại quầy bán vé của rạp (không áp dụng khi mua online).</li>
                <li>
                  Các đối tượng khán giả nêu trên phải xuất trình giấy tờ chứng minh hợp lệ khi mua vé và trước khi vào phòng chiếu:
                  <div className="pl-6 pt-1 space-y-1 text-xs">
                    <p>Trẻ em từ 14 đến 16 tuổi, người cao tuổi: xuất trình Căn cước công dân (CCCD).</p>
                    <p>Người có công với cách mạng: xuất trình giấy xác nhận theo quy định.</p>
                    <p>Người có hoàn cảnh đặc biệt khó khăn: xuất trình Giấy chứng nhận hộ nghèo.</p>
                    <p>Người khuyết tật: xuất trình Giấy xác nhận khuyết tật.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Phần 4: Quy định ngày Lễ Tết & Các trường hợp loại trừ */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
            4. Quy định ngày Lễ, Tết & Các trường hợp không áp dụng ưu đãi
          </h2>

          <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <div>
              <h3 className="font-bold text-slate-900 mb-1.5">Áp dụng giá vé ngày Lễ, Tết cho các ngày:</h3>
              <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
                <li>Các ngày nghỉ Lễ, Tết theo quy định của nhà nước: Tết Nguyên Đán, Tết Dương Lịch, Giỗ Tổ Hùng Vương (10/3 Âm lịch), ngày 30/4, 1/5, ngày Quốc khánh 2/9.</li>
                <li>Các ngày lễ kỷ niệm: 14/2 (Lễ Tình nhân), 8/3 (Quốc tế Phụ nữ), 24/12 (Giáng sinh).</li>
                <li>Các ngày nghỉ bù do kỳ nghỉ Lễ, Tết trùng vào Thứ 7 hoặc Chủ Nhật.</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 mb-1.5">Trường hợp không áp dụng ưu đãi:</h3>
              <p className="text-slate-600 text-xs sm:text-sm">
                Không áp dụng các chế độ ưu đãi, chính sách giảm giá và các chương trình khuyến mại khác vào các ngày 20/10, 20/11, Halloween 31/10, các ngày Lễ, Tết, các suất chiếu sớm (Sneak Show) và các suất chiếu đặc biệt.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 mb-1.5">Dịch vụ vé tập thể, hợp đồng doanh nghiệp:</h3>
              <p className="text-slate-600 text-xs sm:text-sm">
                Quý cơ quan, trường học, doanh nghiệp có nhu cầu đặt vé xem phim tập thể hoặc hợp đồng thuê phòng chiếu trọn gói xin vui lòng liên hệ Bộ phận Dịch vụ khách hàng qua Hotline: <strong>1900 6000</strong> hoặc <strong>024.35141791</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Phần 5: Lưu ý quan trọng khi mua vé */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide text-slate-900">
            5. Lưu ý quan trọng khi mua vé xem phim
          </h2>
          <p className="text-sm font-semibold text-justify leading-relaxed text-red-600">
            Đề nghị Quý khán giả lưu ý khi mua vé xem phim (đặc biệt khi mua vé online). CineMind không chấp nhận hoàn tiền hoặc đổi vé đã thanh toán thành công khi mua vé online và vé mua sai quy định tại quầy vé.
          </p>
          <p className="text-xs text-center text-slate-500 italic pt-1">
            Rất mong Quý khán giả phối hợp thực hiện. Xin trân trọng cảm ơn!
          </p>
        </div>
      </section>
    </div>
  );
};

export default TicketPrices;
