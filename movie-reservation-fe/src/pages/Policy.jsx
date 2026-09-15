import React, { useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';

const Policy = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'privacy' ? 'privacy' : 'terms';

  useEffect(() => {
    // Đồng bộ URL hash nếu người dùng truy cập /policy#privacy hoặc /policy#terms
    if (location.hash === '#privacy' && activeTab !== 'privacy') {
      setSearchParams({ tab: 'privacy' });
    } else if (location.hash === '#terms' && activeTab !== 'terms') {
      setSearchParams({ tab: 'terms' });
    }
  }, [location.hash, activeTab, setSearchParams]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="flex-grow py-8 px-4 sm:px-6 max-w-5xl mx-auto w-full flex flex-col gap-6 font-sans">
      {/* Tiêu đề trang & Tab chuyển đổi */}
      <div className="w-full text-center space-y-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
          Chính Sách & Điều Khoản
        </h1>

        {/* Tab Switcher Bar - Kế thừa kiểu dáng từ trang Profile */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 border-b border-slate-200 pb-4">
          <button
            type="button"
            onClick={() => handleTabChange('terms')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 shadow-xs'
            }`}
          >
            <span>Điều khoản sử dụng</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('privacy')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 shadow-xs'
            }`}
          >
            <span>Chính sách bảo mật</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ĐIỀU KHOẢN SỬ DỤNG */}
      {activeTab === 'terms' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8 text-slate-700 leading-relaxed text-sm">
          {/* Mục 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              1. Quy định chung & Phạm vi áp dụng
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                Điều khoản này áp dụng cho mọi khách hàng thực hiện giao dịch đặt vé xem phim và combo dịch vụ trực tuyến trên nền tảng CineMind.
              </li>
              <li>
                Khách hàng khi truy cập và nhấn xác nhận thanh toán được xem là đã đọc, hiểu rõ và đồng ý vô điều kiện với tất cả các điều khoản, quy định được nêu tại đây.
              </li>
              <li>
                CineMind có quyền sửa đổi, bổ sung các nội dung của điều khoản nhằm phù hợp với quy định pháp luật và chính sách vận hành của rạp mà không cần thông báo trước đến từng khách hàng.
              </li>
            </ul>
          </section>

          {/* Mục 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              2. Quy định phân loại phim theo độ tuổi
            </h2>
            <p className="text-xs text-slate-500 italic">
              (Căn cứ theo quy định của Luật Điện ảnh Việt Nam và thông tư hướng dẫn phân loại phim)
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong>Phim P:</strong> Phim được phép phổ biến rộng rãi cho mọi lứa tuổi khán giả.
              </li>
              <li>
                <strong>Phim K:</strong> Khán giả dưới 13 tuổi có thể xem phim với điều kiện phải có cha mẹ hoặc người giám hộ hợp pháp đi cùng.
              </li>
              <li>
                <strong>Phim T13:</strong> Phim chỉ dành cho người xem từ đủ 13 tuổi trở lên.
              </li>
              <li>
                <strong>Phim T16:</strong> Phim chỉ dành cho người xem từ đủ 16 tuổi trở lên.
              </li>
              <li>
                <strong>Phim T18:</strong> Phim chỉ dành cho người xem từ đủ 18 tuổi trở lên.
              </li>
              <li>
                <strong>Phim C:</strong> Phim cấm phổ biến.
              </li>
              <li>
                Khách hàng có trách nhiệm tự kiểm tra độ tuổi phù hợp của bản thân và người đi cùng trước khi đặt vé. Nhân viên soát vé tại rạp có quyền yêu cầu xuất trình Căn cước công dân hoặc giấy tờ tùy thân hợp lệ trước khi vào phòng chiếu.
              </li>
              <li>
                Trong trường hợp khách hàng không đáp ứng đúng độ tuổi theo quy định của phim đã mua vé, rạp CineMind có quyền từ chối cho vào phòng chiếu và <strong>hoàn toàn không hoàn trả tiền vé</strong>.
              </li>
            </ul>
          </section>

          {/* Mục 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              3. Quy trình đặt vé & Giữ chỗ trực tuyến
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                Thời gian giữ ghế tối đa cho mỗi giao dịch là <strong>10 phút</strong> kể từ khi chọn ghế đến khi hoàn tất thanh toán. Quá thời gian này, hệ thống sẽ tự động giải phóng ghế để phục vụ các khán giả khác.
              </li>
              <li>
                Sau khi thanh toán thành công, hệ thống CineMind sẽ gửi mã xác nhận vé điện tử (kèm mã QR) đến email đã đăng ký và hiển thị trong mục Lịch sử giao dịch của tài khoản.
              </li>
              <li>
                Khách hàng có trách nhiệm kiểm tra kỹ các thông tin: tên phim, suất chiếu, phòng chiếu, vị trí ghế và combo bắp nước trước khi tiến hành thanh toán.
              </li>
            </ul>
          </section>

          {/* Mục 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              4. Chính sách không hoàn - hủy - đổi vé
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong>Vé xem phim và các dịch vụ đi kèm đã thanh toán thành công KHÔNG THỂ HỦY, ĐỔI SUẤT CHIẾU HOẶC HOÀN LẠI TIỀN MẶT</strong> dưới bất kỳ hình thức nào.
              </li>
              <li>
                CineMind không chịu trách nhiệm giải quyết việc hoàn tiền đối với các trường hợp khách hàng đặt nhầm rạp, nhầm ngày giờ, đến trễ giờ chiếu hoặc không đến xem phim.
              </li>
              <li>
                Trường hợp bất khả kháng khi suất chiếu bị hủy do sự cố kỹ thuật phòng chiếu, mất điện diện rộng hoặc thiên tai, CineMind sẽ chủ động thông báo và hỗ trợ đổi sang suất chiếu khác hoặc hoàn 100% tiền vé theo quy định.
              </li>
            </ul>
          </section>

          {/* Mục 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              5. Nội quy phòng chiếu & Bảo vệ bản quyền
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                Khách hàng vui lòng có mặt tại cụm rạp trước giờ chiếu ít nhất 10 - 15 phút để làm thủ tục soát vé và nhận đồ ăn uống.
              </li>
              <li>
                Nghiêm cấm mang đồ ăn, thức uống từ bên ngoài vào khuôn viên phòng chiếu của CineMind.
              </li>
              <li>
                <strong>Nghiêm cấm tuyệt đối mọi hành vi quay phim, chụp ảnh, ghi âm hoặc phát trực tiếp (livestream) nội dung phim</strong> trong phòng chiếu dưới bất kỳ hình thức nào. Mọi trường hợp vi phạm bản quyền sở hữu trí tuệ sẽ bị lập biên bản, mời ra khỏi rạp ngay lập tức và chuyển giao hồ sơ cho cơ quan chức năng xử lý theo pháp luật.
              </li>
              <li>
                Vui lòng giữ trật tự chung, chuyển điện thoại sang chế độ rung/im lặng, không hút thuốc (bao gồm cả thuốc lá điện tử) và không gác chân lên ghế phía trước.
              </li>
            </ul>
          </section>
        </div>
      )}

      {/* TAB 2: CHÍNH SÁCH BẢO MẬT */}
      {activeTab === 'privacy' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8 text-slate-700 leading-relaxed text-sm">
          {/* Mục 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              1. Mục đích thu thập thông tin cá nhân
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                Xử lý đơn đặt vé, gửi mã xác nhận và vé điện tử có mã QR qua email và hệ thống tra cứu.
              </li>
              <li>
                Quản lý tài khoản thành viên, tích lũy điểm thưởng và hỗ trợ áp dụng các chương trình ưu đãi dành riêng cho khách hàng.
              </li>
              <li>
                Hỗ trợ giải đáp các thắc mắc, tiếp nhận và xử lý khiếu nại, phản hồi của khách hàng trong quá trình sử dụng dịch vụ.
              </li>
              <li>
                Liên hệ trong các tình huống khẩn cấp như thay đổi lịch chiếu, hủy suất chiếu do sự cố kỹ thuật bất khả kháng.
              </li>
            </ul>
          </section>

          {/* Mục 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              2. Phạm vi thông tin thu thập
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                Thông tin cá nhân cơ bản: Họ và tên, số điện thoại liên hệ, địa chỉ email, ngày sinh, giới tính.
              </li>
              <li>
                Thông tin giao dịch: Lịch sử đặt vé, mã đơn hàng, suất chiếu, số ghế, combo bắp nước và trạng thái thanh toán.
              </li>
              <li>
                Dữ liệu kỹ thuật: Địa chỉ IP, loại thiết bị, trình duyệt web và cookie phiên làm việc nhằm duy trì trạng thái đăng nhập và đảm bảo an toàn tài khoản.
              </li>
            </ul>
          </section>

          {/* Mục 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              3. Bảo mật thanh toán trực tuyến
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                Toàn bộ quy trình thanh toán vé xem phim trực tuyến tại CineMind được thực hiện thông qua cổng thanh toán được cấp phép VNPAY, tuân thủ tiêu chuẩn bảo mật quốc tế PCI-DSS.
              </li>
              <li>
                <strong>CineMind hoàn toàn không lưu trữ thông tin thẻ ngân hàng</strong>, số tài khoản, số bí mật CVV/CVC hoặc mã OTP của khách hàng trên hệ thống máy chủ.
              </li>
            </ul>
          </section>

          {/* Mục 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              4. Cam kết không chia sẻ dữ liệu
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                CineMind cam kết bảo mật tuyệt đối dữ liệu cá nhân của khách hàng theo đúng quy định của pháp luật Việt Nam.
              </li>
              <li>
                Tuyệt đối không bán, chuyển nhượng hoặc cung cấp dữ liệu khách hàng cho bên thứ ba vì mục đích tiếp thị hoặc thương mại trái phép.
              </li>
              <li>
                Thông tin cá nhân chỉ được chia sẻ trong trường hợp cơ quan nhà nước có thẩm quyền yêu cầu bằng văn bản chính thức theo quy định của pháp luật.
              </li>
            </ul>
          </section>

          {/* Mục 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              5. Quyền hạn của khách hàng đối với thông tin cá nhân
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                Khách hàng có quyền tra cứu, cập nhật thông tin cá nhân của mình bất kỳ lúc nào tại trang Quản lý tài khoản cá nhân.
              </li>
              <li>
                Khách hàng có quyền gửi yêu cầu khóa tài khoản hoặc xóa vĩnh viễn dữ liệu cá nhân khi ngừng sử dụng dịch vụ tại CineMind.
              </li>
            </ul>
          </section>

          {/* Mục 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              6. Đầu mối liên hệ giải quyết khiếu nại & Bảo mật
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong>Đơn vị chủ quản:</strong> Hệ thống Rạp Chiếu Phim CineMind
              </li>
              <li>
                <strong>Hotline hỗ trợ:</strong> 1900 6000 (8:00 - 22:00 hàng ngày)
              </li>
              <li>
                <strong>Email hỗ trợ khách hàng:</strong> support@cinemind.vn
              </li>
              <li>
                <strong>Email tiếp nhận bảo mật:</strong> privacy@cinemind.vn
              </li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
};

export default Policy;
