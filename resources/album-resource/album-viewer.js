(function () {
  function normalizeLandingUrl() {
    try {
      const path = window.location.pathname || "";
      const matched = path.match(/^(.*)\/index\.php$/i);
      if (!matched) {
        return;
      }
      const query = window.location.search || "";
      if (/[?&]route=/.test(query)) {
        return;
      }
      const base = matched[1] || "";
      const target =
        (base === "" ? "/" : base + "/") + query + (window.location.hash || "");
      window.history.replaceState(window.history.state, document.title, target);
    } catch (_err) {
      // Ignore history API errors on locked-down browsers.
    }
  }

  normalizeLandingUrl();

  function resolveApiBase() {
    const path = window.location.pathname || "/";
    if (path.toLowerCase().endsWith("/index.php")) {
      return path;
    }
    if (path.endsWith("/")) {
      return path + "index.php";
    }
    return path.replace(/\/[^/]*$/, "/") + "index.php";
  }

  function buildApiUrl(route, params) {
    const cleanRoute = String(route || "").replace(/^\/+/, "");
    const query = new URLSearchParams(params || {});
    if (cleanRoute) {
      query.set("route", cleanRoute);
    }
    const base = resolveApiBase();
    const queryString = query.toString();
    return base + (queryString ? "?" + queryString : "");
  }
  const albumsApiPath = buildApiUrl("__albums__");
  const sourceRoots = {
    albums: "src/albums/",
    row: "src/row/",
    thumbs: "src/thumbs/",
    audio: "__audio__/",
  };
  const defaultLang = "vi";
  const imageRowsPerBatch = 5;
  const imageCardMinWidth = 220;
  const imageGridGap = 14;
  const sortModes = ["time_desc", "time_asc", "name_asc", "name_desc"];
  const sortModeDefs = [
    { value: "time_desc", labelKey: "sort_time_desc" },
    { value: "time_asc", labelKey: "sort_time_asc" },
    { value: "name_asc", labelKey: "sort_name_asc" },
    { value: "name_desc", labelKey: "sort_name_desc" },
  ];
  const loadMoreThreshold = 320;
  const imageObserverMargin = "350px 0px";
  const viewerMinLoadingMs = 260;
  const inviteRequestPageSizeOptions = [10, 20, 50];

  const fallbackDict = {
    vi: {
      lang_name: "Tiếng Việt",
      lang_flag: "🇻🇳",
      sidebar_title: "Album Ảnh",
      sidebar_hint: "Nguồn hiển thị: Ảnh tối ưu",
      sidebar_collapse: "Thu gọn menu",
      sidebar_expand: "Mở menu",
      initial_title: "Chưa chọn album",
      initial_description: "Chọn album bên trái để xem ảnh.",
      guest_kicker: "Guest access",
      guest_title: "Mời truy cập",
      guest_page_title: "Yêu cầu mời - Album Viewer",
      guest_subtitle: "Nhập email của bạn để gửi yêu cầu tới quản trị viên.",
      guest_email_label: "Email",
      guest_email_placeholder: "Nhập email của bạn",
      guest_token_prompt: "Nhập email đã được yêu cầu để đăng nhập.",
      guest_token_invalid: "Token không hợp lệ hoặc đã hết hạn.",
      guest_token_login: "Đăng nhập",
      guest_admin_login: "Đăng nhập",
      guest_submit: "Gửi yêu cầu",
      guest_missing: "Vui lòng nhập email hợp lệ.",
      guest_failed: "Không gửi được yêu cầu.",
      guest_sent: "Đã gửi yêu cầu tới quản trị viên",
      admin_nav_open: "Quản Trị",
      admin_nav_back: "Album Ảnh",
      admin_page_title: "Quản Trị - Album Viewer",
      invite_requests_button: "Quản lý yêu cầu",
      invite_requests_kicker: "Quản trị",
      invite_requests_title: "Danh sách yêu cầu mời",
      invite_requests_subtitle:
        "Xem toàn bộ email guest đã gửi yêu cầu vào hệ thống.",
      invite_requests_refresh: "Tải lại",
      invite_requests_loading: "Đang tải danh sách yêu cầu...",
      invite_requests_empty: "Chưa có yêu cầu nào.",
      invite_requests_fail: "Không tải được danh sách yêu cầu.",
      invite_requests_col_no: "STT",
      invite_requests_col_email: "Email",
      invite_requests_col_count: "Số lần",
      invite_requests_col_status: "Status",
      invite_requests_col_created: "Tạo lúc",
      invite_requests_col_ip: "IP",
      invite_requests_col_path: "Path",
      invite_requests_col_agent: "User agent",
      invite_requests_col_action: "Action",
      invite_requests_search_title: "Tìm kiếm",
      invite_requests_search_subtitle: "Lọc nhanh theo từng cột bên dưới.",
      invite_requests_search_apply: "Tìm kiếm",
      invite_requests_search_reset: "Đặt lại",
      invite_requests_search_placeholder: "Nhập giá trị",
      invite_requests_search_all: "Tất cả",
      invite_requests_search_hide_filters: "Ẩn bộ lọc",
      invite_requests_search_show_filters: "Hiện bộ lọc",
      invite_requests_no_match: "Không tìm thấy kết quả phù hợp.",
      invite_requests_path_label: "Yêu cầu mời",
      invite_requests_action_delete: "Xóa yêu cầu",
      invite_requests_action_access: "Cấp token",
      invite_requests_action_renew: "Gia hạn token",
      invite_requests_action_copy: "Sao chép liên kết",
      invite_requests_action_lock: "Khóa token",
      invite_requests_action_unlock: "Mở khóa token",
      invite_requests_action_confirm: "Xác nhận thao tác: {action}?",
      invite_requests_page_size_label: "STT",
      invite_requests_page_prev: "Trang trước",
      invite_requests_page_next: "Trang sau",
      invite_requests_copy_success: "Đã sao chép liên kết",
      invite_requests_copy_fail: "Không thể sao chép liên kết",
      invite_requests_delete_confirm: "Xóa yêu cầu này?",
      invite_requests_updated: "Đã cập nhật yêu cầu.",
      invite_status_pending: "Chờ",
      invite_status_locked: "Khóa",
      invite_status_active: "Đã cấp",
      invite_status_expired: "Hết",
      album_unnamed: "Album không tên",
      album_count: "{count} ảnh",
      album_empty: "Album này chưa có ảnh.",
      album_default_name: "Album {index}",
      view_all: "Xem tất cả",
      no_album_title: "Không có album",
      no_album_desc: "Chưa có ảnh hiển thị",
      no_album_empty: "Upload ảnh và chờ server xử lý để hiển thị.",
      error_title: "Lỗi tải dữ liệu",
      error_desc: "Không đọc được dữ liệu album từ server",
      error_empty:
        "Không tải được album. Hãy kiểm tra quyền thư mục và cấu hình PHP trên server.",
      settings_button: "Settings",
      language_label: "Ngôn ngữ",
      theme_label: "Theme",
      mode_label: "Chế độ",
      color_label: "Màu sắc",
      theme_light: "Sáng",
      theme_dark: "Tối",
      theme_system: "Hệ thống",
      color_office: "Office",
      color_office_2007: "Office 2007 - 2010",
      color_grayscale: "Grayscale",
      color_blue_warm: "Blue Warm",
      color_blue: "Blue",
      radius_label: "Bo góc",
      radius_value: "{value}x",
      language_vi: "Tiếng Việt",
      language_en: "English",
      search_placeholder: "Tìm kiếm",
      search_title: "Tìm kiếm",
      sort_label: "Sắp xếp ảnh",
      sort_time_desc: "Thời gian: Mới nhất",
      sort_time_asc: "Thời gian: Cũ nhất",
      sort_name_asc: "Tên: A → Z",
      sort_name_desc: "Tên: Z → A",
      search_empty: "Không có ảnh phù hợp.",
      upload_album_button: "Tải ảnh lên",
      upload_audio_button: "Quản lý âm thanh",
      upload_audio_auth_required: "Bạn cần đăng nhập để upload audio.",
      upload_audio_modal_title: "Quản lý âm thanh",
      upload_audio_files_label: "Chọn file audio mới:",
      upload_audio_help: "Chọn một hoặc nhiều file âm thanh để upload",
      upload_audio_submit: "Upload",
      upload_audio_list_title: "Danh sách âm thanh đã upload",
      upload_audio_list_header: "Tên file",
      upload_audio_col_no: "STT",
      upload_audio_col_title: "Tên file",
      upload_audio_col_action: "Thao tác",
      upload_audio_delete: "Xóa",
      upload_audio_delete_confirm: 'Xóa file "{file}"?',
      upload_audio_delete_success: "Đã xóa file.",
      upload_audio_delete_fail: "Xóa file thất bại.",
      upload_audio_list_empty: "Chưa có file âm thanh nào.",
      audio_preview_play: "Phát nhạc",
      audio_preview_pause: "Tạm dừng",
      audio_preview_close: "Đóng",
      audio_preview_volume: "Âm lượng",
      audio_preview_prev: "Bài trước",
      audio_preview_next: "Bài sau",
      audio_play_all: "Phát tất cả",
      audio_stop_all: "Dừng phát",
      upload_audio_file_required: "Vui lòng chọn ít nhất 1 file âm thanh.",
      upload_audio_success:
        "Đã upload {count} file audio vào thư mục src/audio.",
      upload_audio_fail: "Upload audio thất bại.",
      image_delete: "Xóa ảnh",
      image_hide_label: "Ẩn ảnh",
      image_show_label: "Hiện ảnh",
      image_delete_confirm: 'Xóa ảnh "{file}"?',
      image_delete_success: "Đã xóa ảnh.",
      image_delete_fail: "Xóa ảnh thất bại.",
      upload_modal_title: "Tải ảnh lên",
      upload_album_label: "Tên album",
      upload_album_placeholder: "Nhập tên album",
      upload_type_label: "Loại upload:",
      upload_type_files: "Files",
      upload_type_folder: "Folder",
      upload_type_zip: "Zip & Extract",
      upload_files_label: "Chọn file:",
      upload_folder_label: "Chọn folder:",
      upload_zip_label: "Chọn file zip:",
      upload_help_files: "Chọn nhiều file ảnh để upload",
      upload_help_folder: "Chọn folder để upload ảnh",
      upload_help_zip: "Upload file zip, hệ thống tự giải nén ảnh",
      upload_cancel: "Hủy",
      upload_submit: "Tải ảnh lên",
      upload_album_name_required: "Vui lòng nhập tên album.",
      upload_file_required: "Vui lòng chọn dữ liệu upload.",
      upload_album_auth_required: "Bạn cần đăng nhập để upload album.",
      upload_album_success: 'Đã upload {count} ảnh vào album "{album}".',
      upload_album_queued:
        "Ảnh đã upload xong. Hệ thống đang build nền để tạo row/thumbs.",
      upload_build_failed:
        "Build ảnh nền lỗi (code: {code}). Kiểm tra server log storage/build-images.log",
      upload_album_fail: "Upload ảnh thất bại.",
      retry_album_label: "Build lại album",
      retry_album_confirm: 'Chạy build lại album "{album}"?',
      retry_album_success: 'Đã đưa album "{album}" vào hàng chờ build nền.',
      retry_album_fail: "Build lại album thất bại.",
      delete_album_label: "Xóa album",
      delete_album_confirm: 'Xóa toàn bộ album "{album}"?',
      delete_album_success: 'Đã xóa album "{album}".',
      delete_album_fail: "Xóa album thất bại.",
      album_hide_label: "Ẩn album",
      album_show_label: "Hiện album",
      confirm_title: "Xác nhận",
      confirm_yes: "Yes",
      confirm_no: "No",
      notice_success: "Thành công",
      notice_error: "Thất bại",
      notice_warning: "Cảnh báo",
      notice_info: "Thông tin",
      edit_page_label: "Chỉnh sửa trang",
      edit_save_label: "Lưu thay đổi",
      edit_cancel_label: "Hủy chỉnh sửa",
      edit_save_confirm: "Lưu các thay đổi trên trang?",
      edit_cancel_confirm: "Hủy chỉnh sửa? Các thay đổi chưa lưu sẽ mất.",
      edit_no_changes: "Không có thay đổi để lưu.",
      edit_save_success: "Đã lưu thay đổi.",
      edit_save_fail: "Lưu thay đổi thất bại.",
      edit_auth_required: "Bạn cần đăng nhập để chỉnh sửa.",
      logout_label: "Đăng xuất",
      slideshow_start: "Trình chiếu",
      slideshow_stop: "Dừng chiếu",
      slideshow_music_on: "Bật nhạc",
      slideshow_music_off: "Tắt nhạc",
      slideshow_audio_empty:
        "Không tìm thấy file audio trong thư mục src/audio.",
    },
    en: {
      lang_name: "English",
      lang_flag: "🇬🇧",
      sidebar_title: "Photo Albums",
      sidebar_hint: "Display source: Optimized images",
      sidebar_collapse: "Collapse menu",
      sidebar_expand: "Expand menu",
      initial_title: "No album selected",
      initial_description: "Choose an album on the left to view photos.",
      guest_kicker: "Guest access",
      guest_title: "Guest Invite",
      guest_page_title: "Invite Request - Album Viewer",
      guest_subtitle:
        "Enter your email to send an invite request to the admin.",
      guest_email_label: "Email",
      guest_email_placeholder: "Enter your email",
      guest_token_prompt:
        "Enter the email associated with this invite token to log in.",
      guest_token_invalid: "Invalid or expired token.",
      guest_token_login: "Login using token",
      guest_admin_login: "Login",
      guest_submit: "Send Request",
      guest_missing: "Please enter a valid email address.",
      guest_failed: "Could not send the request.",
      guest_sent: "Request sent to the administrator.",
      admin_nav_open: "Admin",
      admin_nav_back: "Photo Albums",
      admin_page_title: "Admin - Album Viewer",
      invite_requests_button: "Manage requests",
      invite_requests_kicker: "Administration",
      invite_requests_title: "Invitation request list",
      invite_requests_subtitle:
        "Review every guest email request submitted to the system.",
      invite_requests_refresh: "Refresh",
      invite_requests_loading: "Loading request list...",
      invite_requests_empty: "No requests yet.",
      invite_requests_fail: "Could not load request list.",
      invite_requests_col_no: "No.",
      invite_requests_col_email: "Email",
      invite_requests_col_count: "Count",
      invite_requests_col_status: "Status",
      invite_requests_col_created: "Created",
      invite_requests_col_ip: "IP",
      invite_requests_col_path: "Path",
      invite_requests_col_agent: "User agent",
      invite_requests_col_action: "Action",
      invite_requests_search_title: "Search",
      invite_requests_search_subtitle: "Filter quickly by the columns below.",
      invite_requests_search_apply: "Search",
      invite_requests_search_reset: "Reset",
      invite_requests_search_placeholder: "Enter value",
      invite_requests_search_all: "All",
      invite_requests_search_hide_filters: "Hide filters",
      invite_requests_search_show_filters: "Show filters",
      invite_requests_no_match: "No matching results.",
      invite_requests_path_label: "Invite request",
      invite_requests_action_delete: "Delete request",
      invite_requests_action_access: "Grant token",
      invite_requests_action_renew: "Renew token",
      invite_requests_action_lock: "Lock token",
      invite_requests_action_unlock: "Unlock token",
      invite_requests_action_confirm: "Confirm action: {action}?",
      invite_requests_delete_confirm: "Delete this request?",
      invite_requests_page_size_label: "Rows",
      invite_requests_page_prev: "Previous page",
      invite_requests_page_next: "Next page",
      invite_requests_updated: "Request updated.",
      invite_status_pending: "Pending",
      invite_status_locked: "Locked",
      invite_status_active: "Granted",
      invite_status_expired: "Expired",
      album_unnamed: "Untitled album",
      album_count: "{count} photos",
      album_empty: "This album has no photos yet.",
      album_default_name: "Album {index}",
      view_all: "View all",
      no_album_title: "No albums",
      no_album_desc: "No display images found",
      no_album_empty: "Upload images and wait for server processing.",
      error_title: "Load error",
      error_desc: "Cannot load album data from server",
      error_empty:
        "Cannot load albums. Check folder permissions and PHP configuration on the server.",
      settings_button: "Settings",
      language_label: "Language",
      theme_label: "Theme",
      mode_label: "Mode",
      color_label: "Color",
      theme_light: "Light",
      theme_dark: "Dark",
      theme_system: "System",
      color_office: "Office",
      color_office_2007: "Office 2007 - 2010",
      color_grayscale: "Grayscale",
      color_blue_warm: "Blue Warm",
      color_blue: "Blue",
      radius_label: "Border Radius",
      radius_value: "{value}x",
      language_vi: "Vietnamese",
      language_en: "English",
      search_placeholder: "Search",
      search_title: "Search",
      sort_label: "Sort images",
      sort_time_desc: "Time: Newest first",
      sort_time_asc: "Time: Oldest first",
      sort_name_asc: "Name: A → Z",
      sort_name_desc: "Name: Z → A",
      search_empty: "No matching photos.",
      upload_album_button: "Upload image",
      upload_audio_button: "Manage Audio",
      upload_audio_auth_required: "You need to login to upload audio.",
      upload_audio_modal_title: "Manage Audio",
      upload_audio_files_label: "Select new audio files:",
      upload_audio_help: "Select one or multiple audio files to upload",
      upload_audio_submit: "Upload",
      upload_audio_list_title: "Uploaded audio files",
      upload_audio_list_header: "Title",
      upload_audio_col_no: "No",
      upload_audio_col_title: "Title",
      upload_audio_col_action: "Action",
      upload_audio_delete: "Delete",
      upload_audio_delete_confirm: 'Delete file "{file}"?',
      upload_audio_delete_success: "File deleted.",
      upload_audio_delete_fail: "Failed to delete file.",
      upload_audio_list_empty: "No audio files yet.",
      audio_preview_play: "Play audio",
      audio_preview_pause: "Pause audio",
      audio_preview_close: "Close",
      audio_preview_volume: "Volume",
      audio_preview_prev: "Previous track",
      audio_preview_next: "Next track",
      audio_play_all: "Play all",
      audio_stop_all: "Stop",
      upload_audio_file_required: "Please select at least one audio file.",
      upload_audio_success: "Uploaded {count} audio file(s) to src/audio.",
      upload_audio_fail: "Audio upload failed.",
      image_delete: "Delete image",
      image_hide_label: "Hide image",
      image_show_label: "Show image",
      image_delete_confirm: 'Delete image "{file}"?',
      image_delete_success: "Image deleted.",
      image_delete_fail: "Failed to delete image.",
      upload_modal_title: "Upload image",
      upload_album_label: "Album Name",
      upload_album_placeholder: "Enter album name",
      upload_type_label: "Upload Type:",
      upload_type_files: "Files",
      upload_type_folder: "Folder",
      upload_type_zip: "Zip & Extract",
      upload_files_label: "Select Files:",
      upload_folder_label: "Select Folder:",
      upload_zip_label: "Select Zip:",
      upload_help_files: "Select multiple image files to upload",
      upload_help_folder: "Select a folder to upload image files",
      upload_help_zip:
        "Upload zip file, images will be extracted automatically",
      upload_cancel: "Cancel",
      upload_submit: "Upload image",
      upload_album_name_required: "Please enter album name.",
      upload_file_required: "Please select upload data.",
      upload_album_auth_required: "You need to login to upload album.",
      upload_album_success: 'Uploaded {count} image(s) to album "{album}".',
      upload_album_queued:
        "Upload completed. Server is building row/thumbs in background.",
      upload_build_failed:
        "Background image build failed (code: {code}). Check server log storage/build-images.log",
      upload_album_fail: "Upload failed.",
      retry_album_label: "Retry album build",
      retry_album_confirm: 'Rebuild album "{album}"?',
      retry_album_success: 'Album "{album}" was queued for background build.',
      retry_album_fail: "Album rebuild failed.",
      delete_album_label: "Delete album",
      delete_album_confirm: 'Delete album "{album}"?',
      delete_album_success: 'Deleted album "{album}".',
      delete_album_fail: "Delete album failed.",
      album_hide_label: "Hide album",
      album_show_label: "Show album",
      confirm_title: "Confirm",
      confirm_yes: "Yes",
      confirm_no: "No",
      notice_success: "Success",
      notice_error: "Error",
      notice_warning: "Warning",
      notice_info: "Info",
      edit_page_label: "Edit Page",
      edit_save_label: "Save Changes",
      edit_cancel_label: "Cancel Edit",
      edit_save_confirm: "Save changes on this page?",
      edit_cancel_confirm: "Cancel editing? Unsaved changes will be lost.",
      edit_no_changes: "No changes to save.",
      edit_save_success: "Changes saved.",
      edit_save_fail: "Failed to save changes.",
      edit_auth_required: "You need to login to edit.",
      logout_label: "Logout",
      slideshow_start: "Slideshow",
      slideshow_stop: "Stop",
      slideshow_music_on: "Music on",
      slideshow_music_off: "Music off",
      slideshow_audio_empty: "No audio files found in src/audio folder.",
    },
  };
  const defaultColorPacks = [
    {
      value: "option-1",
      text: { vi: "option-1", en: "option-1" },
      colors: {
        light: ["#1F2A37", "#5F6F86", "#EEF3FA", "#2E6FB3", "#9FB0C3"],
        dark: ["#F4F8FF", "#A8B8CE", "#253347", "#6CB2FF", "#5A6F88"],
      },
    },
    {
      value: "option-2",
      text: { vi: "Option 2", en: "Option 2" },
      colors: {
        light: ["#2A1F15", "#756150", "#FFF4E8", "#D9631E", "#C7AC93"],
        dark: ["#FFF5EC", "#D8C3AE", "#433227", "#FF9D52", "#7A5E49"],
      },
    },
    {
      value: "option-3",
      text: { vi: "Option 3", en: "Option 3" },
      colors: {
        light: ["#17191D", "#4E5B70", "#D6FBFF", "#E94C56", "#56AEB9"],
        dark: ["#F8FAFF", "#B4C1D2", "#253B45", "#FF6F75", "#3D7680"],
      },
    },
  ];

  const $albumList = $("#album-list");
  const $albumTitle = $("#album-title");
  const $albumDescription = $("#album-description");
  const $guestGate = $("#guest-gate");
  const $guestInviteForm = $("#guest-invite-form");
  const $guestEmail = $("#guest-email");
  const $guestInviteSubmit = $("#guest-invite-submit");
  const $guestInviteMessage = $("#guest-invite-message");
  const $guestGateSubtitle = $(".guest-gate-subtitle");
  let guestTokenLoginMode = false;
  let guestTokenValue = "";
  let guestTokenPending = false;
  const $adminNavButton = $("#admin-nav-button");
  const $inviteRequestsButton = $("#invite-requests-button");
  const $adminPlaceholder = $("#admin-placeholder");
  const $adminPlaceholderForm = $("#admin-placeholder-form");
  const $albumSortToggle = $("#album-sort-toggle");
  const $albumSortMenu = $("#album-sort-menu");
  const $albumSlideshowToggle = $("#album-slideshow-toggle");
  const $scrollTop = $("#scroll-top");
  const $imageGridWrap = $("#image-grid-wrap");
  const $gridLoadingOverlay = $("#grid-loading-overlay");
  const $imageGrid = $("#image-grid");
  const $template = $("#image-item-template");
  const $scrollCardRoute = $("#scroll-card-route");
  const $scrollCardClosed = $("#scroll-card-closed");
  const $scrollCardTitle = $("#scroll-card-title");
  const $scrollCardRecipient = $("#scroll-card-recipient");
  const $scrollCardMessage = $("#scroll-card-message");
  const $scrollCardEvent = $("#scroll-card-event");
  const $scrollCardEventTime = $("#scroll-card-event-time");
  const $scrollCardCeremonyLocation = $("#scroll-card-ceremony-location");
  const $scrollCardSender = $("#scroll-card-sender");
  const $weddingCoverNameA = $("#wedding-cover-name-a");
  const $weddingCoverNameB = $("#wedding-cover-name-b");
  const $weddingCoverDate = $("#wedding-cover-date");
  const $weddingCoverGuest = $("#wedding-cover-guest");
  const $weddingDetailNameA = $("#wedding-detail-name-a");
  const $weddingDetailNameB = $("#wedding-detail-name-b");
  const $weddingDetailDay = $("#wedding-detail-day");
  const $weddingLunarDate = $("#wedding-lunar-date");
  const $weddingGuestTime = $("#wedding-guest-time");
  const $weddingPartyTime = $("#wedding-party-time");
  const $weddingCalendarTitle = $("#wedding-calendar-title");
  const $weddingCalendarDays = $("#wedding-calendar-days");
  const $weddingPartyLocation = $("#wedding-party-location");
  const $weddingMapFrame = $("#wedding-map-frame");
  const $weddingBrideFather = $("#wedding-bride-father");
  const $weddingBrideMother = $("#wedding-bride-mother");
  const $weddingBrideAddress = $("#wedding-bride-address");
  const $weddingGroomFather = $("#wedding-groom-father");
  const $weddingGroomMother = $("#wedding-groom-mother");
  const $weddingGroomAddress = $("#wedding-groom-address");
  const $weddingGuestbookForm = $("#wedding-guestbook-form");
  const $weddingGuestbookName = $("#wedding-guestbook-name");
  const $weddingGuestbookMessage = $("#wedding-guestbook-message");
  const $weddingGuestbookSubmit = $("#wedding-guestbook-submit");
  const $weddingGuestbookStatus = $("#wedding-guestbook-status");
  const $weddingGuestbookList = $("#wedding-guestbook-list");
  const $scrollCardGallery = $("#scroll-card-gallery");
  const $scrollCardMusic = $("#scroll-card-music");
  const $scrollCardWelcome = $("#scroll-card-welcome");
  const scrollCardAudio = $("#scroll-card-audio").get(0);

  const $sidebarTitle = $("#sidebar-title");
  const $sidebarHint = $("#sidebar-hint");
  const $sidebarUserProfile = $("#sidebar-user-profile");
  const $sidebarUserName = $("#sidebar-user-name");
  const $sidebarUserAvatar = $("#sidebar-user-avatar");
  const $sidebarEditPage = $("#sidebar-edit-page");
  const $sidebarEditSave = $("#sidebar-edit-save");
  const $sidebarEditCancel = $("#sidebar-edit-cancel");
  const $albumUploadButton = $("#album-upload-button");
  const $audioUploadButton = $("#audio-upload-button");
  const $invitationLinkButton = $("#invitation-link-button");
  const $audioUploadModal = $("#audio-upload-modal");
  const $audioUploadInput = $("#audio-upload-input");
  const $audioUploadFilesLabel = $("#audio-upload-files-label");
  const $audioUploadHelpText = $("#audio-upload-help-text");
  const $audioUploadError = $("#audio-upload-error");
  const $audioUploadCancel = $("#audio-upload-cancel");
  const $audioUploadSubmit = $("#audio-upload-submit");
  const $audioList = $("#audio-list");
  const $audioListEmpty = $("#audio-list-empty");
  const $audioTableWrap = $("#audio-table-wrap");
  const $audioUploadPlayAll = $("#audio-upload-play-all");
  const $audioPreviewPanel = $("#audio-preview-panel");
  const $audioPreviewHome = $audioPreviewPanel.parent();
  const $audioPreviewToggle = $("#audio-preview-toggle");
  const $audioPreviewPrev = $("#audio-preview-prev");
  const $audioPreviewTitle = $("#audio-preview-title");
  const $audioPreviewProgress = $("#audio-preview-progress");
  const $audioPreviewTrack = $(".audio-preview-track");
  const $audioPreviewSeek = $("#audio-preview-seek");
  const $audioPreviewTime = $("#audio-preview-time");
  const $audioPreviewClose = $("#audio-preview-close");
  const $audioPreviewNext = $("#audio-preview-next");
  const $audioPreviewVolumeToggle = $("#audio-preview-volume-toggle");
  const $audioPreviewVolumeWrap = $audioPreviewVolumeToggle.closest(
    ".audio-preview-volume-wrap",
  );
  const $audioPreviewVolumePopover = $audioPreviewVolumeWrap.find(
    ".audio-preview-volume-popover",
  );
  const $audioPreviewVolumeRange = $("#audio-preview-volume-range");
  const $audioColNo = $("#audio-col-no");
  const $audioColTitle = $("#audio-col-title");
  const $audioColAction = $("#audio-col-action");
  const $invitationLinkModal = $("#invitation-link-modal");
  const $invitationLinkFormSection = $("#invitation-link-form-section");
  const $invitationLinkFormHeader = $("#invitation-link-form-header");
  const $invitationLinkFormTitle = $("#invitation-link-form-title");
  const $invitationLinkFormToggle = $("#invitation-link-form-toggle");
  const $invitationLinkPrefix = $("#invitation-link-prefix");
  const $invitationLinkTitle = $("#invitation-link-title");
  const $invitationLinkName = $("#invitation-link-name");
  const $invitationLinkSuffix = $("#invitation-link-suffix");
  const $invitationLinkMessage = $("#invitation-link-message");
  const $invitationLinkEditCancel = $("#invitation-link-edit-cancel");
  const $invitationLinkSubmit = $("#invitation-link-submit");
  const $invitationLinkCancel = $("#invitation-link-cancel");
  const $invitationLinkError = $("#invitation-link-error");
  const $invitationLinkList = $("#invitation-link-list");
  const $invitationLinkListEmpty = $("#invitation-link-list-empty");
  const $invitationLinkTableWrap = $("#invitation-link-table-wrap");
  const $uploadModal = $("#upload-modal");
  const $uploadAlbumName = $("#upload-album-name");
  const $uploadAlbumError = $("#upload-album-error");
  const $uploadTypeOptions = $("#upload-type-options");
  const $uploadFilesInput = $("#upload-files-input");
  const $uploadFolderInput = $("#upload-folder-input");
  const $uploadZipInput = $("#upload-zip-input");
  const $uploadFilesLabel = $("#upload-files-label");
  const defaultInvitationGreeting =
    "Hành trình yêu thương chính thức lật sang trang mới. Thật trọn vẹn và ý nghĩa khi ngày trọng đại này có sự đồng hành, chứng kiến và sẻ chia niềm vui của [title] [name]";
  const $uploadHelpText = $("#upload-help-text");
  const $uploadFilesError = $("#upload-files-error");
  const $uploadError = $("#upload-error");
  const $uploadCancel = $("#upload-cancel");
  const $uploadSubmit = $("#upload-submit");
  const $confirmModal = $("#confirm-modal");
  const $confirmModalTitle = $("#confirm-modal-title");
  const $confirmModalMessage = $("#confirm-modal-message");
  const $confirmModalRenewDays = $("#confirm-modal-renew-days");
  const $confirmModalDays = $("#confirm-modal-days");
  const $confirmNo = $("#confirm-no");
  const $confirmYes = $("#confirm-yes");
  const $alertStack = $("#alert-stack");
  const $albumSearchInput = $("#album-search-input");
  const $albumSearchClear = $("#album-search-clear");
  const $sidebarToggle = $("#sidebar-toggle");
  const $sidebarToggleIcon = $("#sidebar-toggle-icon");
  const $mobileMenuToggle = $("#mobile-menu-toggle");
  const $mobileMenuToggleIcon = $("#mobile-menu-toggle-icon");
  const $mobileSidebarOverlay = $("#mobile-sidebar-overlay");
  const $settingsToggle = $("#settings-toggle");
  const $settingsPanel = $("#settings-panel");
  const $settingsLogout = $("#settings-logout");
  const $languageLabel = $("#language-label");
  const $languageSwitches = $("#language-switches");
  const $themeSectionLabel = $("#theme-section-label");
  const $modeLabel = $("#mode-label");
  const $themeOptions = $("#theme-options");
  const $colorLabel = $("#color-label");
  const $colorOptions = $("#color-options");
  const $radiusLabel = $("#radius-label");
  const $radiusRange = $("#radius-range");
  const $radiusValue = $("#radius-value");
  const $imageViewer = $("#image-viewer");
  const $imageViewerCanvas = $("#image-viewer-canvas");
  const $imageViewerImg = $("#image-viewer-img");
  const $imageViewerLoading = $("#image-viewer-loading");
  const $imageViewerCaption = $("#image-viewer-caption");
  const $imageViewerSlideshowCounter = $("#image-viewer-slideshow-counter");
  const $imageViewerAudioToggle = $("#image-viewer-audio-toggle");
  const $imageViewerAudioPopover = $("#image-viewer-audio-popover");
  const $imageViewerAudioRange = $("#image-viewer-audio-range");
  const $imageViewerAudioWrap = $(".audio-volume-wrap");
  const $imageViewerSlideshowToggle = $("#image-viewer-slideshow-toggle");
  const $imageViewerDownload = $("#image-viewer-download");
  const $imageViewerSidebarToggle = $("#image-viewer-sidebar-toggle");
  const $imageViewerThumbList = $("#image-viewer-thumb-list");
  const $imageViewerRotateLeft = $("#image-viewer-rotate-left");
  const $imageViewerRotateRight = $("#image-viewer-rotate-right");
  const $imageViewerZoomIn = $("#image-viewer-zoom-in");
  const $imageViewerZoomOut = $("#image-viewer-zoom-out");
  const $imageViewerZoomReset = $("#image-viewer-zoom-reset");
  const $imageViewerPrev = $("#image-viewer-prev");
  const $imageViewerNext = $("#image-viewer-next");
  const $imageViewerStagePrev = $("#image-viewer-stage-prev");
  const $imageViewerStageNext = $("#image-viewer-stage-next");
  const $imageViewerClose = $("#image-viewer-close");

  const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  const mobileMedia = window.matchMedia("(max-width: 900px)");
  const slideshowAudio = new Audio();
  slideshowAudio.preload = "auto";
  slideshowAudio.loop = false;
  let slideshowAudioRequest = null;
  const previewAudio = new Audio();
  previewAudio.preload = "auto";
  previewAudio.loop = false;

  const state = {
    lang: localStorage.getItem("album-viewer-lang") || defaultLang,
    theme: localStorage.getItem("album-viewer-theme") || "system",
    colorPack: localStorage.getItem("album-viewer-color-pack") || "option-1",
    colorPacks: defaultColorPacks.map(function (pack) {
      return {
        value: pack.value,
        text: { vi: pack.text.vi, en: pack.text.en },
        colors: {
          light: pack.colors.light.slice(0, 5),
          dark: pack.colors.dark.slice(0, 5),
        },
      };
    }),
    radius: Number(localStorage.getItem("album-viewer-radius") || "1"),
    sidebarCollapsed:
      localStorage.getItem("album-viewer-sidebar-collapsed") === "1",
    mobileSidebarOpen: false,
    collapsedFolders: {},
    dict: fallbackDict,
    albums: [],
    albumTitleOverrides: {},
    activeIndex: 0,
    sortMode: localStorage.getItem("album-viewer-sort-mode") || "time_desc",
    searchQuery: "",
    hasError: false,
    renderToken: 0,
    gridLoadingToken: 0,
    imageObserver: null,
    progressiveRenderers: [],
    scrollTicking: false,
    viewerZoom: 1,
    viewerRotation: 0,
    viewerPanX: 0,
    viewerPanY: 0,
    viewerDragging: false,
    viewerDragStartX: 0,
    viewerDragStartY: 0,
    viewerDragOriginX: 0,
    viewerDragOriginY: 0,
    viewerLoadingSince: 0,
    viewerItems: [],
    viewerIndex: -1,
    viewerSidebarHidden: false,
    viewerCaptionRaw: "",
    slideshowPlaying: false,
    slideshowTimer: null,
    slideshowMode: false,
    slideshowControlsVisible: true,
    authUser: "",
    authRole: "",
    editingPage: false,
    uploadType: "files",
    uploading: false,
    uploadingAudio: false,
    creatingInvitationLink: false,
    viewerPreloadCache: {},
    inviteSearchCollapsed: true,
    viewerPreloadPromises: {},
    confirmResolver: null,
    slideshowAudioVolume: Number(
      localStorage.getItem("album-viewer-slideshow-audio-volume") || "0.6",
    ),
    slideshowAudioLastVolume: Number(
      localStorage.getItem("album-viewer-slideshow-audio-last-volume") || "0.6",
    ),
    slideshowAudioList: [],
    slideshowAudioIndex: 0,
    previewAudioFile: "",
    previewAudioPlaying: false,
    previewAudioAutoAdvance: false,
    previewAudioVolume: Number(
      localStorage.getItem("album-viewer-preview-audio-volume") || "0.8",
    ),
    previewAnchorRow: null,
    previewAnchorSlot: null,
    pageMode: "gallery",
    adminPanel: "",
    inviteRequests: [],
    inviteRequestsLoading: false,
    invitationLinks: [],
    invitationLinksLoading: false,
    editingInvitationLinkCode: "",
    inviteRequestPage: 1,
    inviteRequestPageSize: Number(
      localStorage.getItem("album-viewer-invite-request-page-size") || "10",
    ),
    inviteRequestFilters: {
      email: "",
      status: "",
      count: "",
      created: "",
      ip: "",
      path: "",
      agent: "",
    },
    hiddenImageBase: {},
    hiddenImageCurrent: {},
    scrollCard: {
      enabled: false,
      status: "closed",
      title: "Chúc mừng!",
      message:
        "Cảm ơn bạn đã luôn đồng hành và tạo nên những khoảnh khắc đáng nhớ.",
      messageFromQuery: false,
      invitationCode: "",
      guestbookVisible: true,
      recipientPrefix: "",
      recipientTitle: "",
      recipientName: "",
      recipientDisplayName: "",
      recipientSuffix: "",
      senderName: "Yêu thương",
      brideName: "Ngọc Ánh",
      groomName: "Thế Bảo",
      brideFather: "Lê Văn Khoa",
      brideMother: "Phạm Thị Kim Oanh",
      brideFamilyAddress: "456 Lê Lợi, Quận 3, TP. Hồ Chí Minh",
      groomFather: "Trần Văn Tuấn",
      groomMother: "Lê Thị Hương",
      groomFamilyAddress: "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
      eventDate: "3 tháng 5, 2026",
      eventTime: "",
      lunarDate: "(Tức ngày 17/03 năm Bính Ngọ)",
      guestTime: "17:30",
      partyTime: "18:00",
      ceremonyLocation: "Tư gia",
      partyLocation:
        "White Palace Convention Center, 194 Hoàng Văn Thụ, Phú Nhuận, Hồ Chí Minh",
      mapQuery:
        "White Palace Hoàng Văn Thụ, 194 Hoàng Văn Thụ, Phú Nhuận, Hồ Chí Minh",
      eventTimeFromQuery: false,
      eventLocationFromQuery: false,
      images: [],
      musicUrl: "",
      musicReady: false,
      musicPlaying: false,
      autoplayBlocked: false,
    },
  };

  function getScrollCardConfigFromLocation() {
    const query = new URLSearchParams(window.location.search || "");
    const decodedRecipient = decodeInvitationRecipientParams(query) || {};
    const invitationCode = String(query.get("data") || "").trim();
    const recipientPrefix = String(decodedRecipient.prefix || "").trim();
    const recipientTitle = String(decodedRecipient.title || "").trim();
    const recipientName = String(decodedRecipient.name || "").trim();
    const recipientSuffix = String(decodedRecipient.suffix || "").trim();
    const recipientDisplayName = [recipientTitle, recipientName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (!recipientDisplayName) {
      return { enabled: false };
    }
    return {
      enabled: true,
      invitationCode: invitationCode,
      title: String(query.get("card_title") || "Chúc mừng!").trim(),
      message: String(
        query.get("message") ||
          "Cảm ơn bạn đã luôn đồng hành và tạo nên những khoảnh khắc đáng nhớ.",
      ).trim(),
      messageFromQuery: query.has("message"),
      recipientPrefix: recipientPrefix,
      recipientTitle: recipientTitle,
      recipientName: recipientName,
      recipientDisplayName: recipientDisplayName,
      recipientSuffix: recipientSuffix,
      senderName: String(query.get("from") || "Yêu thương").trim(),
      eventTime: String(query.get("time") || "").trim(),
      partyLocation: String(query.get("location") || "").trim(),
      eventTimeFromQuery: query.has("time"),
      eventLocationFromQuery: query.has("location"),
      musicUrl: String(query.get("music") || "").trim(),
    };
  }

  Object.assign(state.scrollCard, getScrollCardConfigFromLocation());

  function getPageModeFromLocation() {
    const path = String(window.location.pathname || "").replace(/\/+$/, "");
    const route =
      new URLSearchParams(window.location.search || "").get("route") || "";
    if (path.endsWith("/admin") || route === "admin") {
      return "admin";
    }
    return "gallery";
  }

  state.pageMode = getPageModeFromLocation();

  if (!["light", "dark", "system"].includes(state.theme)) {
    state.theme = "system";
  }
  if (!sortModes.includes(state.sortMode)) {
    state.sortMode = "time_desc";
    localStorage.setItem("album-viewer-sort-mode", state.sortMode);
  }
  if (Number.isNaN(state.radius) || state.radius < 0 || state.radius > 2) {
    state.radius = 1;
  }
  if (
    !Number.isFinite(state.slideshowAudioVolume) ||
    state.slideshowAudioVolume < 0 ||
    state.slideshowAudioVolume > 1
  ) {
    state.slideshowAudioVolume = 0.6;
  }
  if (
    !Number.isFinite(state.slideshowAudioLastVolume) ||
    state.slideshowAudioLastVolume <= 0 ||
    state.slideshowAudioLastVolume > 1
  ) {
    state.slideshowAudioLastVolume = 0.6;
  }
  if (
    !Number.isFinite(state.previewAudioVolume) ||
    state.previewAudioVolume < 0 ||
    state.previewAudioVolume > 1
  ) {
    state.previewAudioVolume = 0.8;
  }
  if (!inviteRequestPageSizeOptions.includes(Number(state.inviteRequestPageSize))) {
    state.inviteRequestPageSize = 10;
  }
  previewAudio.volume = state.previewAudioVolume;
  previewAudio.muted = state.previewAudioVolume <= 0;
  try {
    const parsed = JSON.parse(
      localStorage.getItem("album-viewer-collapsed-folders") || "{}",
    );
    state.collapsedFolders = parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    state.collapsedFolders = {};
  }

  function t(key, vars) {
    const fallback = (state.dict[defaultLang] || {})[key] || key;
    const message = (state.dict[state.lang] || {})[key] || fallback;

    if (!vars) {
      return message;
    }

    return Object.keys(vars).reduce(function (result, name) {
      return result.replaceAll("{" + name + "}", String(vars[name]));
    }, message);
  }

  function getResolvedTheme() {
    if (state.theme === "system") {
      return themeMedia.matches ? "dark" : "light";
    }
    return state.theme === "dark" ? "dark" : "light";
  }

  function applyTheme() {
    const resolved = getResolvedTheme();
    $("html").attr("data-theme", resolved);
    renderSidebarAvatarIcon();
  }

  function getSidebarAvatarIconSvg() {
    const resolved = getResolvedTheme();
    if (resolved === "dark") {
      return (
        '<svg class="icon-stroke sidebar-weather-icon" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M20 16.2a4.5 4.5 0 0 0-1.6-8.7A6.5 6.5 0 0 0 6.1 9.2 3.8 3.8 0 0 0 6 16.8h14z"></path>' +
        '<path d="M16.5 5.4a3.3 3.3 0 0 0 2.8 4.9A3.9 3.9 0 1 1 16.5 5.4z"></path>' +
        '<line x1="9" y1="18.2" x2="8.2" y2="20"></line>' +
        '<line x1="13" y1="18.2" x2="12.2" y2="20"></line>' +
        '<line x1="17" y1="18.2" x2="16.2" y2="20"></line>' +
        "</svg>"
      );
    }
    return (
      '<svg class="icon-stroke sidebar-weather-icon" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M20 16.2a4.5 4.5 0 0 0-1.6-8.7A6.5 6.5 0 0 0 6.1 9.2 3.8 3.8 0 0 0 6 16.8h14z"></path>' +
      '<circle cx="16.5" cy="5.5" r="2.3"></circle>' +
      '<line x1="16.5" y1="1.6" x2="16.5" y2="2.6"></line>' +
      '<line x1="19.3" y1="2.7" x2="18.6" y2="3.4"></line>' +
      '<line x1="20.4" y1="5.5" x2="19.4" y2="5.5"></line>' +
      '<line x1="9" y1="18.2" x2="8.2" y2="20"></line>' +
      '<line x1="13" y1="18.2" x2="12.2" y2="20"></line>' +
      '<line x1="17" y1="18.2" x2="16.2" y2="20"></line>' +
      "</svg>"
    );
  }

  function renderSidebarAvatarIcon() {
    $sidebarUserAvatar.html(getSidebarAvatarIconSvg());
  }

  function ensureValidColorPack() {
    const available = state.colorPacks.map(function (item) {
      return item.value;
    });
    if (!available.includes(state.colorPack)) {
      state.colorPack = available.includes("option-1")
        ? "option-1"
        : available[0] || "option-1";
      localStorage.setItem("album-viewer-color-pack", state.colorPack);
    }
  }

  function getActiveColorPack() {
    const active =
      state.colorPacks.find(function (item) {
        return item.value === state.colorPack;
      }) || state.colorPacks[0];
    return active || defaultColorPacks[0];
  }

  function expandHex(hex) {
    const raw = String(hex || "")
      .trim()
      .replace(/^#/, "");
    if (raw.length === 3) {
      return raw
        .split("")
        .map(function (ch) {
          return ch + ch;
        })
        .join("");
    }
    if (raw.length === 6) {
      return raw;
    }
    return null;
  }

  function hexToRgb(hex) {
    const expanded = expandHex(hex);
    if (!expanded) {
      return null;
    }
    const r = parseInt(expanded.slice(0, 2), 16);
    const g = parseInt(expanded.slice(2, 4), 16);
    const b = parseInt(expanded.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) {
      return null;
    }
    return { r: r, g: g, b: b };
  }

  function rgbToHex(rgb) {
    function channel(value) {
      const clamped = Math.max(0, Math.min(255, Math.round(value)));
      return clamped.toString(16).padStart(2, "0");
    }
    return "#" + channel(rgb.r) + channel(rgb.g) + channel(rgb.b);
  }

  function imageStemKey(name) {
    const raw = String(name || "").trim();
    if (!raw) {
      return "";
    }
    const stem = raw.replace(/\.[^/.]+$/, "");
    return stem.toLowerCase();
  }

  function cloneHiddenImageMap(source) {
    const result = {};
    Object.keys(source || {}).forEach(function (folder) {
      const entries = source[folder] || {};
      result[folder] = Object.assign({}, entries);
    });
    return result;
  }

  function buildHiddenImageBase(albums) {
    const map = {};
    (albums || []).forEach(function (album) {
      if (!album || album.isAll) {
        return;
      }
      const folder = String(album.folder || "").trim();
      if (!folder || !Array.isArray(album.images)) {
        return;
      }
      album.images.forEach(function (entry) {
        if (!entry || !entry.hidden) {
          return;
        }
        const key = imageStemKey(entry.original || entry.name || "");
        if (!key) {
          return;
        }
        if (!map[folder]) {
          map[folder] = {};
        }
        map[folder][key] = true;
      });
    });
    return map;
  }

  function resetHiddenImageDrafts() {
    state.hiddenImageCurrent = cloneHiddenImageMap(state.hiddenImageBase);
  }

  function isImageHidden(folder, name) {
    const folderKey = String(folder || "").trim();
    if (!folderKey) {
      return false;
    }
    const stem = imageStemKey(name);
    if (!stem) {
      return false;
    }
    return !!(
      state.hiddenImageCurrent[folderKey] &&
      state.hiddenImageCurrent[folderKey][stem]
    );
  }

  function setImageHidden(folder, name, hidden) {
    const folderKey = String(folder || "").trim();
    const stem = imageStemKey(name);
    if (!folderKey || !stem) {
      return;
    }
    if (hidden) {
      if (!state.hiddenImageCurrent[folderKey]) {
        state.hiddenImageCurrent[folderKey] = {};
      }
      state.hiddenImageCurrent[folderKey][stem] = true;
    } else if (state.hiddenImageCurrent[folderKey]) {
      delete state.hiddenImageCurrent[folderKey][stem];
      if (!Object.keys(state.hiddenImageCurrent[folderKey]).length) {
        delete state.hiddenImageCurrent[folderKey];
      }
    }
  }

  function buildHiddenImageChanges() {
    const changes = [];
    const folders = new Set(
      Object.keys(state.hiddenImageBase || {}).concat(
        Object.keys(state.hiddenImageCurrent || {}),
      ),
    );
    folders.forEach(function (folder) {
      const base = state.hiddenImageBase[folder] || {};
      const curr = state.hiddenImageCurrent[folder] || {};
      Object.keys(curr).forEach(function (stem) {
        if (!base[stem]) {
          changes.push({ folder: folder, stem: stem, hidden: true });
        }
      });
      Object.keys(base).forEach(function (stem) {
        if (!curr[stem]) {
          changes.push({ folder: folder, stem: stem, hidden: false });
        }
      });
    });
    return changes;
  }

  function blendHex(baseHex, mixHex, amount) {
    const base = hexToRgb(baseHex);
    const mix = hexToRgb(mixHex);
    const a = Math.max(0, Math.min(1, Number(amount) || 0));
    if (!base || !mix) {
      return String(baseHex || mixHex || "#9fb0c3");
    }
    return rgbToHex({
      r: base.r + (mix.r - base.r) * a,
      g: base.g + (mix.g - base.g) * a,
      b: base.b + (mix.b - base.b) * a,
    });
  }

  function applyColorPack() {
    ensureValidColorPack();
    const active = getActiveColorPack();
    const themeKey = getResolvedTheme() === "dark" ? "dark" : "light";
    const themeColors = (active.colors && active.colors[themeKey]) || [];
    const palette = [];
    for (let i = 0; i < 5; i += 1) {
      palette.push(themeColors[i] || themeColors[0] || "#4f81bd");
    }
    const textPrimary = palette[0];
    const textSecondary = palette[1];
    const buttonColor = palette[2];
    const activeColor = palette[3];
    const borderColor = palette[4];
    const accentHover =
      themeKey === "dark"
        ? blendHex(activeColor, textSecondary, 0.18)
        : blendHex(activeColor, textPrimary, 0.24);
    const accentPress =
      themeKey === "dark"
        ? blendHex(activeColor, textPrimary, 0.34)
        : blendHex(activeColor, textPrimary, 0.42);
    const accentSoft = blendHex(activeColor, buttonColor, 0.72);
    const uiLineColor =
      themeKey === "dark"
        ? blendHex(borderColor, textSecondary, 0.34)
        : blendHex(borderColor, textPrimary, 0.34);
    $("html").attr("data-color", state.colorPack);
    $("html").css({
      "--ink": textPrimary,
      "--muted": textSecondary,
      "--button-bg": buttonColor,
      "--accent": activeColor,
      "--accent-hover": accentHover,
      "--accent-press": accentPress,
      "--accent-soft": accentSoft,
      "--line": uiLineColor,
      "--accent-1": palette[0],
      "--accent-2": palette[1],
      "--accent-3": palette[2],
      "--accent-4": palette[3],
      "--accent-5": palette[4],
    });
  }

  function applyRadius() {
    $("html").css("--radius-factor", String(state.radius));
  }

  function setViewMode(mode) {
    const guest = mode === "guest";
    const admin = mode === "admin";
    $("body").toggleClass("is-auth-pending", false);
    $("body").toggleClass("is-guest-view", guest);
    $("body").toggleClass("is-app-view", !guest && !admin);
    $("body").toggleClass("is-admin-view", admin);
  }

  function updateAdminUserClass() {
    const isAdminUser =
      String(state.authRole || "").toLowerCase() === "admin" &&
      !!String(state.authUser || "").trim();
    $("body").toggleClass("is-admin-user", isAdminUser);
  }

  function updateAdminNavUi() {
    if (!$adminNavButton.length) {
      return;
    }
    const isAdminUser =
      String(state.authRole || "").toLowerCase() === "admin" &&
      !!String(state.authUser || "").trim();
    if (!isAdminUser) {
      $adminNavButton.addClass("is-hidden");
      return;
    }
    const isAdminPage = state.pageMode === "admin";
    $adminNavButton
      .removeClass("is-hidden")
      .attr(
        "aria-label",
        isAdminPage ? t("admin_nav_back") : t("admin_nav_open"),
      )
      .attr("title", isAdminPage ? t("admin_nav_back") : t("admin_nav_open"))
      .find(".text")
      .text(isAdminPage ? t("admin_nav_back") : t("admin_nav_open"));
  }

  function updateInviteRequestsButtonUi() {
    if (!$inviteRequestsButton.length) {
      return;
    }
    const isAdminUser =
      String(state.authRole || "").toLowerCase() === "admin" &&
      !!String(state.authUser || "").trim();
    const isAdminPage = state.pageMode === "admin";
    if (!isAdminUser || !isAdminPage) {
      $inviteRequestsButton.addClass("is-hidden").removeClass("is-active");
      return;
    }
    $inviteRequestsButton
      .removeClass("is-hidden")
      .toggleClass("is-active", state.adminPanel === "requests")
      .attr("aria-label", t("invite_requests_button"))
      .attr("title", t("invite_requests_button"))
      .find(".text")
      .text(t("invite_requests_button"));
  }

  function updateInvitationLinkButtonUi() {
    if (!$invitationLinkButton.length) {
      return;
    }
    const isAdminUser =
      String(state.authRole || "").toLowerCase() === "admin" &&
      !!String(state.authUser || "").trim();
    const isAdminPage = state.pageMode === "admin";
    if (!isAdminUser || !isAdminPage) {
      $invitationLinkButton.addClass("is-hidden").removeClass("is-active");
      return;
    }
    $invitationLinkButton
      .removeClass("is-hidden")
      .toggleClass("is-active", !$invitationLinkModal.hasClass("is-hidden"));
  }

  function escapeHtml(value) {
    return $("<div></div>")
      .text(value == null ? "" : String(value))
      .html();
  }

  function decodeBase64UrlString(value) {
    const encoded = String(value || "").trim();
    if (!encoded) {
      return "";
    }
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded =
      normalized + "===".slice((normalized.length + 3) % 4);
    try {
      return window.atob(padded);
    } catch (_err) {
      return "";
    }
  }

  function decodeInvitationRecipientParams(query) {
    const payload = decodeBase64UrlString(query && query.get("data"));
    if (!payload) {
      return null;
    }
    const params = new URLSearchParams(payload);
    return {
      prefix: String(params.get("prefix") || "").trim(),
      title: String(params.get("title") || "").trim(),
      name: String(params.get("name") || "").trim(),
      suffix: String(params.get("suffix") || "").trim(),
    };
  }

  function formatInviteDate(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return "—";
    }
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return raw;
    }
    try {
      return new Intl.DateTimeFormat(state.lang === "en" ? "en-US" : "vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    } catch (_err) {
      return date.toLocaleString();
    }
  }

  function parseInviteDate(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return null;
    }
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function getInviteRequestStatus(entry) {
    const guestToken = entry && entry.guest_token;
    const guestTokenLocked = !!(entry && entry.guest_token_locked);
    const hasToken = !(
      guestToken === null ||
      guestToken === undefined ||
      String(guestToken).trim() === ""
    );
    if (!hasToken) {
      return {
        key: "invite_status_pending",
        className: "is-pending",
        action: "access",
      };
    }

    if (guestTokenLocked) {
      return {
        key: "invite_status_locked",
        className: "is-locked",
        action: "unlock",
      };
    }

    const expiresAt = parseInviteDate(
      (entry && entry.guest_token_expires_at) ||
        (entry && entry.guest_token_expire_at) ||
        (entry && entry.token_expires_at) ||
        (entry && entry.guest_token_expires) ||
        (entry && entry.expires_at),
    );
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      return {
        key: "invite_status_expired",
        className: "is-expired",
        action: "renew",
      };
    }

    return {
      key: "invite_status_active",
      className: "is-active",
      action: "lock",
    };
  }

  function describeUserAgent(value) {
    const userAgent = String(value || "").trim();
    const lines = [];
    const platformParts = [];
    const appParts = [];
    const isMac = /Macintosh/i.test(userAgent);
    const isIntel = /\bIntel\b/i.test(userAgent);
    const isIPhone = /\biPhone\b/i.test(userAgent);
    const isIPad = /\biPad\b/i.test(userAgent);
    const isIOS = /\b(iPhone|iPad|iPod)\b/i.test(userAgent);
    const isZalo = /\bZalo\b/i.test(userAgent);
    const osMatch = userAgent.match(/Mac OS X ([0-9_]+)/i);
    const iosMatch = userAgent.match(/OS ([0-9_]+) like Mac OS X/i);
    const chromeMatch = userAgent.match(/Chrome\/([0-9.]+)/i);
    const safariMatch = userAgent.match(/Version\/([0-9.]+).*Safari\//i);
    const webkitMatch = userAgent.match(/AppleWebKit\/([0-9.]+)/i);
    const mobileMatch = userAgent.match(/\bMobile\/([0-9A-Za-z.]+)/i);

    if (isMac) {
      platformParts.push("Mac");
    }
    if (isIntel) {
      platformParts.push("Intel");
    }
    if (isIPhone) {
      platformParts.push("iPhone");
    }
    if (isIPad) {
      platformParts.push("iPad");
    }
    if (isIOS) {
      platformParts.push("iOS");
    }
    if (osMatch) {
      lines.push("macOS " + osMatch[1].replaceAll("_", "."));
    }
    if (iosMatch) {
      lines.push("iOS " + iosMatch[1].replaceAll("_", "."));
    }
    if (chromeMatch) {
      appParts.push("Chrome " + chromeMatch[1].split(".")[0]);
    }
    if (safariMatch) {
      appParts.push("Safari " + safariMatch[1]);
    }
    if (isZalo) {
      appParts.push("Zalo");
    }
    if (webkitMatch) {
      appParts.push("WebKit " + webkitMatch[1]);
    }
    if (mobileMatch) {
      appParts.push("Mobile " + mobileMatch[1]);
    }

    if (platformParts.length) {
      lines.push(platformParts.join(" • "));
    }
    if (appParts.length) {
      lines.push(appParts.join(" • "));
    }

    if (!lines.length) {
      lines.push(userAgent || "Không thể phân tích user-agent này.");
    }

    return {
      raw: userAgent,
      lines: lines,
    };
  }

  function summarizeUserAgentForTable(value) {
    const userAgent = String(value || "").trim();
    const parts = [];
    const osMatch = userAgent.match(/Mac OS X ([0-9_]+)/i);
    const iosMatch = userAgent.match(/OS ([0-9_]+) like Mac OS X/i);
    const windowsMatch = userAgent.match(/Windows NT ([0-9.]+)/i);
    const linuxMatch = userAgent.match(/Linux/i);
    const chromeMatch = userAgent.match(/Chrome\/([0-9.]+)/i);
    const safariMatch = userAgent.match(/Version\/([0-9.]+).*Safari\//i);
    const isMac = /Macintosh/i.test(userAgent);
    const isIntel = /\bIntel\b/i.test(userAgent);
    const isIPhone = /\biPhone\b/i.test(userAgent);
    const isIPad = /\biPad\b/i.test(userAgent);
    const isZalo = /\bZalo\b/i.test(userAgent);

    if (isMac && osMatch) {
      parts.push("macOS " + osMatch[1].replaceAll("_", "."));
    } else if (isIPhone || isIPad || iosMatch) {
      parts.push(isIPhone ? "iPhone" : "iPad");
      if (iosMatch) {
        parts.push("iOS " + iosMatch[1].replaceAll("_", "."));
      }
    } else if (windowsMatch) {
      parts.push("Windows NT " + windowsMatch[1]);
    } else if (linuxMatch) {
      parts.push("Linux");
    }

    if (isIntel) {
      parts.push("Intel");
    }
    if (chromeMatch) {
      parts.push("Chrome " + chromeMatch[1].split(".")[0]);
    }
    if (safariMatch) {
      parts.push("Safari " + safariMatch[1]);
    }
    if (isZalo) {
      parts.push("Zalo");
    }

    if (!parts.length) {
      return userAgent || "—";
    }

    return parts.join(" • ");
  }

  function summarizeRequestPathForTable(value) {
    const requestPath = String(value || "").trim();
    if (!requestPath) {
      return "—";
    }
    if (requestPath.includes("__invite_request__")) {
      return t("invite_requests_path_label");
    }
    return requestPath;
  }

  function getInviteRequestStatusOptions() {
    return [
      { value: "", label: t("invite_requests_search_all") },
      { value: "pending", label: t("invite_status_pending") },
      { value: "active", label: t("invite_status_active") },
      { value: "locked", label: t("invite_status_locked") },
      { value: "expired", label: t("invite_status_expired") },
    ];
  }

  function normalizeSearchValue(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function matchInviteRequestFilter(value, query) {
    const needle = normalizeSearchValue(query);
    if (!needle) {
      return true;
    }
    return normalizeSearchValue(value).includes(needle);
  }

  function filterInviteRequests(requests) {
    const filters = state.inviteRequestFilters || {};
    return (Array.isArray(requests) ? requests : []).filter(function (entry) {
      const status = getInviteRequestStatus(entry);
      const countValue = Number.isFinite(Number(entry && entry.request_count))
        ? String(Number(entry.request_count))
        : "0";
      const createdValue = formatInviteDate(entry && entry.created_at);
      const pathValue = summarizeRequestPathForTable(
        entry && entry.request_path,
      );
      const agentShort = summarizeUserAgentForTable(entry && entry.user_agent);
      const agentRaw = entry && entry.user_agent;
      if (
        !matchInviteRequestFilter(entry && entry.guest_email, filters.email)
      ) {
        return false;
      }
      if (normalizeSearchValue(filters.status)) {
        const statusValue = String(status.key || "")
          .toLowerCase()
          .replace(/^invite_status_/, "");
        if (normalizeSearchValue(filters.status) !== statusValue) {
          return false;
        }
      }
      if (!matchInviteRequestFilter(countValue, filters.count)) {
        return false;
      }
      if (!matchInviteRequestFilter(createdValue, filters.created)) {
        return false;
      }
      if (!matchInviteRequestFilter(entry && entry.ip, filters.ip)) {
        return false;
      }
      if (
        !matchInviteRequestFilter(
          pathValue + " " + (entry && entry.request_path),
          filters.path,
        )
      ) {
        return false;
      }
      if (
        !matchInviteRequestFilter(agentShort + " " + agentRaw, filters.agent)
      ) {
        return false;
      }
      return true;
    });
  }

  function getInviteRequestFiltersFromForm($form) {
    return {
      email: String($form.find('[name="invite_email"]').val() || "").trim(),
      status: String($form.find('[name="invite_status"]').val() || "").trim(),
      count: String($form.find('[name="invite_count"]').val() || "").trim(),
      created: String($form.find('[name="invite_created"]').val() || "").trim(),
      ip: String($form.find('[name="invite_ip"]').val() || "").trim(),
      path: String($form.find('[name="invite_path"]').val() || "").trim(),
      agent: String($form.find('[name="invite_agent"]').val() || "").trim(),
    };
  }

  function setInviteRequestFilters(filters) {
    state.inviteRequestFilters = {
      email: String((filters && filters.email) || "").trim(),
      status: String((filters && filters.status) || "").trim(),
      count: String((filters && filters.count) || "").trim(),
      created: String((filters && filters.created) || "").trim(),
      ip: String((filters && filters.ip) || "").trim(),
      path: String((filters && filters.path) || "").trim(),
      agent: String((filters && filters.agent) || "").trim(),
    };
  }

  function getInviteRequestPageSize() {
    const size = Number(state.inviteRequestPageSize);
    return inviteRequestPageSizeOptions.includes(size) ? size : 10;
  }

  function setInviteRequestPageSize(size) {
    const nextSize = inviteRequestPageSizeOptions.includes(Number(size))
      ? Number(size)
      : 10;
    state.inviteRequestPageSize = nextSize;
    state.inviteRequestPage = 1;
    localStorage.setItem(
      "album-viewer-invite-request-page-size",
      String(nextSize),
    );
  }

  function getInviteRequestPageCount(total) {
    const size = getInviteRequestPageSize();
    const count = Math.ceil(Math.max(0, Number(total) || 0) / size);
    return Math.max(1, count);
  }

  function clampInviteRequestPage(page, total) {
    const pageCount = getInviteRequestPageCount(total);
    return Math.min(pageCount, Math.max(1, Number(page) || 1));
  }

  function getInviteRequestPageRange(currentPage, pageCount) {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, function (_value, index) {
        return index + 1;
      });
    }
    const pages = [1];
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(pageCount - 1, currentPage + 1);
    if (currentPage <= 3) {
      end = 4;
    } else if (currentPage >= pageCount - 2) {
      start = pageCount - 3;
    }
    if (start > 2) {
      pages.push("...");
    }
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
    if (end < pageCount - 1) {
      pages.push("...");
    }
    pages.push(pageCount);
    return pages;
  }

  function renderInviteRequestPagination(total) {
    const pageSize = getInviteRequestPageSize();
    const pageCount = getInviteRequestPageCount(total);
    state.inviteRequestPage = clampInviteRequestPage(state.inviteRequestPage, total);
    const currentPage = state.inviteRequestPage;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(total, currentPage * pageSize);
    const optionsHtml = inviteRequestPageSizeOptions
      .map(function (size) {
        return (
          '<option value="' +
          String(size) +
          '"' +
          (size === pageSize ? " selected" : "") +
          ">" +
          String(size) +
          "</option>"
        );
      })
      .join("");
    const pageButtons = getInviteRequestPageRange(currentPage, pageCount)
      .map(function (item) {
        if (item === "...") {
          return '<span class="admin-request-pagination-ellipsis">…</span>';
        }
        const active = item === currentPage ? " is-active" : "";
        return (
          '<button type="button" class="admin-request-pagination-page' +
          active +
          '" data-page="' +
          String(item) +
          '">' +
          String(item) +
          "</button>"
        );
      })
      .join("");
    return (
      '<div class="admin-request-pagination">' +
      '<div class="admin-request-pagination-range">' +
      escapeHtml(String(total === 0 ? 0 : start)) +
      "–" +
      escapeHtml(String(total === 0 ? 0 : end)) +
      " / " +
      escapeHtml(String(total)) +
      "</div>" +
      '<div class="admin-request-pagination-controls">' +
      '<button type="button" class="admin-request-pagination-nav" data-page="' +
      String(Math.max(1, currentPage - 1)) +
      '" ' +
      (currentPage <= 1 ? "disabled" : "") +
      ' aria-label="' +
      escapeHtml(t("invite_requests_page_prev")) +
      '" title="' +
      escapeHtml(t("invite_requests_page_prev")) +
      '">‹</button>' +
      pageButtons +
      '<button type="button" class="admin-request-pagination-nav" data-page="' +
      String(Math.min(pageCount, currentPage + 1)) +
      '" ' +
      (currentPage >= pageCount ? "disabled" : "") +
      ' aria-label="' +
      escapeHtml(t("invite_requests_page_next")) +
      '" title="' +
      escapeHtml(t("invite_requests_page_next")) +
      '">›</button>' +
      "</div>" +
      '<label class="admin-request-pagination-size">' +
      '<select id="invite-request-page-size" class="admin-request-pagination-select">' +
      optionsHtml +
      "</select>" +
      "</label>" +
      "</div>"
    );
  }

  function renderInviteRequestSearchForm() {
    const filters = state.inviteRequestFilters || {};
    const isCollapsed = Boolean(state.inviteSearchCollapsed);
    const statusOptions = getInviteRequestStatusOptions()
      .map(function (option) {
        const selected =
          String(option.value || "") === String(filters.status || "");
        return (
          '<option value="' +
          escapeHtml(option.value) +
          '"' +
          (selected ? ' selected="selected"' : "") +
          ">" +
          escapeHtml(option.label) +
          "</option>"
        );
      })
      .join("");

    const searchIcon =
      '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>';
    const resetIcon =
      '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 3 3 9 9 9"/></svg>';
    const caretIcon =
      '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';

    return [
      '<section class="admin-request-search">',
      '<header class="admin-request-search-header">',
      '<div class="admin-request-search-title">',
      '<span class="admin-request-search-icon">' + searchIcon + "</span>",
      "<span>" + t("invite_requests_search_title") + "</span>",
      "</div>",
      '<div class="admin-request-search-header-actions">',
      '<button type="button" id="invite-request-search-reset-header" class="admin-request-search-header-action" aria-label="' +
        t("invite_requests_search_reset") +
        '">' +
        resetIcon +
        "</button>",
      '<button type="button" id="invite-request-search-toggle" class="admin-request-search-header-action admin-request-search-header-action--toggle" aria-expanded="' +
        (!isCollapsed).toString() +
        '">' +
        caretIcon +
        "</button>",
      "</div>",
      "</header>",
      '<div class="admin-request-search-details' +
        (isCollapsed ? " is-collapsed" : "") +
        '">',
      '<p class="admin-request-search-subtitle">' +
        t("invite_requests_search_subtitle") +
        "</p>",
      '<div id="invite-request-search-form" class="admin-request-search-form">',
      '<div class="admin-request-search-grid">',
      '<label class="admin-request-search-field admin-request-search-col-sm-12 admin-request-search-col-md-6 admin-request-search-col-lg-4 admin-request-search-col-xl-3">',
      '<span class="admin-request-search-label">' +
        t("invite_requests_col_email") +
        "</span>",
      '<input name="invite_email" class="admin-request-search-input" type="text" value="' +
        escapeHtml(filters.email || "") +
        '" placeholder="' +
        t("invite_requests_search_placeholder") +
        '">',
      "</label>",
      '<label class="admin-request-search-field admin-request-search-col-sm-12 admin-request-search-col-md-6 admin-request-search-col-lg-4 admin-request-search-col-xl-3">',
      '<span class="admin-request-search-label">' +
        t("invite_requests_col_status") +
        "</span>",
      '<select name="invite_status" class="admin-request-search-input admin-request-search-select">' +
        statusOptions +
        "</select>",
      "</label>",
      '<label class="admin-request-search-field admin-request-search-col-sm-12 admin-request-search-col-md-6 admin-request-search-col-lg-4 admin-request-search-col-xl-3">',
      '<span class="admin-request-search-label">' +
        t("invite_requests_col_count") +
        "</span>",
      '<input name="invite_count" class="admin-request-search-input" type="text" value="' +
        escapeHtml(filters.count || "") +
        '" placeholder="' +
        t("invite_requests_search_placeholder") +
        '">',
      "</label>",
      '<label class="admin-request-search-field admin-request-search-col-sm-12 admin-request-search-col-md-6 admin-request-search-col-lg-4 admin-request-search-col-xl-3">',
      '<span class="admin-request-search-label">' +
        t("invite_requests_col_created") +
        "</span>",
      '<input name="invite_created" class="admin-request-search-input" type="text" value="' +
        escapeHtml(filters.created || "") +
        '" placeholder="' +
        t("invite_requests_search_placeholder") +
        '">',
      "</label>",
      '<label class="admin-request-search-field admin-request-search-col-sm-12 admin-request-search-col-md-6 admin-request-search-col-lg-4 admin-request-search-col-xl-3">',
      '<span class="admin-request-search-label">' +
        t("invite_requests_col_ip") +
        "</span>",
      '<input name="invite_ip" class="admin-request-search-input" type="text" value="' +
        escapeHtml(filters.ip || "") +
        '" placeholder="' +
        t("invite_requests_search_placeholder") +
        '">',
      "</label>",
      '<label class="admin-request-search-field admin-request-search-col-sm-12 admin-request-search-col-md-6 admin-request-search-col-lg-4 admin-request-search-col-xl-3">',
      '<span class="admin-request-search-label">' +
        t("invite_requests_col_path") +
        "</span>",
      '<input name="invite_path" class="admin-request-search-input" type="text" value="' +
        escapeHtml(filters.path || "") +
        '" placeholder="' +
        t("invite_requests_search_placeholder") +
        '">',
      "</label>",
      '<label class="admin-request-search-field admin-request-search-col-sm-12 admin-request-search-col-md-6 admin-request-search-col-lg-4 admin-request-search-col-xl-3">',
      '<span class="admin-request-search-label">' +
        t("invite_requests_col_agent") +
        "</span>",
      '<input name="invite_agent" class="admin-request-search-input" type="text" value="' +
        escapeHtml(filters.agent || "") +
        '" placeholder="' +
        t("invite_requests_search_placeholder") +
        '">',
      "</label>",
      "</div>",
      '<div class="admin-request-search-actions">',
      '<button type="button" id="invite-request-search-submit" class="admin-request-search-submit">' +
        t("invite_requests_search_apply") +
        "</button>",
      '<button type="button" id="invite-request-search-reset" class="admin-request-search-reset">' +
        t("invite_requests_search_reset") +
        "</button>",
      "</div>",
      "</div>",
      "</div>",
      "</section>",
    ].join("");
  }

  function getInviteRequestActionLabel(action) {
    const key = "invite_requests_action_" + String(action || "").toLowerCase();
    return t(key);
  }

  function getInviteRequestActionIcon(action) {
    const normalized = String(action || "").toLowerCase();
    if (normalized === "delete") {
      return '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
    }
    if (normalized === "access") {
      return '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-5"/></svg>';
    }
    if (normalized === "renew") {
      return '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/></svg>';
    }
    if (normalized === "lock") {
      return '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
    }
    if (normalized === "unlock") {
      return '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-1.8"/><path d="M14 10v-3"/></svg>';
    }
    if (normalized === "copy") {
      return '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    }
    return '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle></svg>';
  }

  function closeUserAgentTooltip() {
    const $tooltip = $("#admin-user-agent-tooltip");
    if ($tooltip.length) {
      $tooltip.removeClass("is-visible");
      window.setTimeout(function () {
        $tooltip.remove();
      }, 180);
    }
  }

  function showAdminDetailTooltip(anchorEl, options) {
    if (!anchorEl) {
      return;
    }
    closeUserAgentTooltip();

    const title = String((options && options.title) || "").trim();
    const raw = String((options && options.raw) || "").trim();
    const lines = Array.isArray(options && options.lines) ? options.lines : [];
    const $tooltip = $(
      '<div id="admin-user-agent-tooltip" class="admin-user-agent-tooltip" role="tooltip" aria-hidden="true">' +
        '<button type="button" class="admin-user-agent-close" aria-label="Đóng" title="Đóng">×</button>' +
        '<div class="admin-user-agent-title">User agent</div>' +
        '<div class="admin-user-agent-raw"></div>' +
        '<ul class="admin-user-agent-lines"></ul>' +
        "</div>",
    );

    $tooltip.find(".admin-user-agent-title").text(title || "Chi tiết");
    $tooltip.find(".admin-user-agent-raw").text(raw);
    const $lines = $tooltip.find(".admin-user-agent-lines");
    lines.forEach(function (line) {
      $lines.append($("<li></li>").text(line));
    });
    if (!lines.length) {
      $lines.remove();
    }
    $tooltip.find(".admin-user-agent-close").on("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      closeUserAgentTooltip();
    });
    $tooltip.on("click", function (event) {
      event.stopPropagation();
    });
    $("body").append($tooltip);

    const rect = anchorEl.getBoundingClientRect();
    const tooltipRect = $tooltip[0].getBoundingClientRect();
    const left = Math.min(
      window.innerWidth - tooltipRect.width - 12,
      Math.max(12, rect.left),
    );
    const top = Math.min(
      window.innerHeight - tooltipRect.height - 12,
      rect.bottom + 8,
    );
    $tooltip.css({
      left: String(left) + "px",
      top: String(top) + "px",
    });

    window.requestAnimationFrame(function () {
      $tooltip.addClass("is-visible").attr("aria-hidden", "false");
    });
  }

  function showUserAgentTooltip(anchorEl, entry) {
    const details = describeUserAgent(entry && entry.user_agent);
    showAdminDetailTooltip(anchorEl, {
      title: "User agent",
      raw: details.raw,
      lines: details.lines,
    });
  }

  function truncateTextPreview(value, limit) {
    const text = String(value || "").trim();
    const max = Number(limit) > 0 ? Number(limit) : 30;
    if (text.length <= max) {
      return text;
    }
    return text.slice(0, Math.max(1, max - 3)).trimEnd() + "...";
  }

  function renderAdminRequestsPanel() {
    if (!$adminPlaceholderForm.length) {
      return;
    }
    if (state.pageMode !== "admin") {
      $adminPlaceholderForm.empty();
      return;
    }

    const requests = Array.isArray(state.inviteRequests)
      ? state.inviteRequests
      : [];
    const filteredRequests = filterInviteRequests(requests);
    const totalRequests = filteredRequests.length;
    const pageSize = getInviteRequestPageSize();
    const pageCount = getInviteRequestPageCount(totalRequests);
    state.inviteRequestPage = clampInviteRequestPage(
      state.inviteRequestPage,
      totalRequests,
    );
    const currentPage = state.inviteRequestPage;
    const pageStart = (currentPage - 1) * pageSize;
    const pageRequests = filteredRequests.slice(pageStart, pageStart + pageSize);
    const loadingHtml = state.inviteRequestsLoading
      ? '<p class="admin-request-empty">' +
        t("invite_requests_loading") +
        "</p>"
      : "";
    const rows = pageRequests
      .map(function (entry, index) {
        const email = escapeHtml(entry && entry.guest_email);
        const createdAt = escapeHtml(
          formatInviteDate(entry && entry.created_at),
        );
        const ip = escapeHtml(entry && entry.ip);
        const userAgent = escapeHtml(entry && entry.user_agent);
        const userAgentShort = escapeHtml(
          summarizeUserAgentForTable(entry && entry.user_agent),
        );
        const requestPath = escapeHtml(
          summarizeRequestPathForTable(entry && entry.request_path),
        );
        const requestPathRaw = escapeHtml(entry && entry.request_path);
        const requestCount = Number.isFinite(
          Number(entry && entry.request_count),
        )
          ? Number(entry.request_count)
          : 0;
        const status = getInviteRequestStatus(entry);
        const actionLabel = getInviteRequestActionLabel(status.action);
        const actionIcon = getInviteRequestActionIcon(status.action);
        const guestEmailRaw = escapeHtml(entry && entry.guest_email);
        const expiredGrantButton =
          status.key === "invite_status_expired"
            ? '<button type="button" class="admin-request-action-button is-state-action is-secondary" data-action="access" data-guest-email="' +
              guestEmailRaw +
              '" aria-label="' +
              escapeHtml(getInviteRequestActionLabel("access")) +
              '" title="' +
              escapeHtml(getInviteRequestActionLabel("access")) +
              '">' +
              getInviteRequestActionIcon("access") +
              "</button>"
            : "";
        const copyLinkButton =
          status.key === "invite_status_active" &&
          String((entry && entry.guest_token) || "").trim()
            ? '<button type="button" class="admin-request-action-button is-state-action is-copy" data-action="copy" data-guest-email="' +
              guestEmailRaw +
              '" data-token="' +
              escapeHtml(String((entry && entry.guest_token) || "")) +
              '" data-request-path="' +
              escapeHtml(String((entry && entry.request_path) || "")) +
              '" aria-label="' +
              escapeHtml(getInviteRequestActionLabel("copy")) +
              '" title="' +
              escapeHtml(getInviteRequestActionLabel("copy")) +
              '">' +
              getInviteRequestActionIcon("copy") +
              "</button>"
            : "";
        return [
          "<tr>",
          "<td>" + (pageStart + index + 1) + "</td>",
          '<td class="admin-request-email">' + email + "</td>",
          "<td>" + requestCount + "</td>",
          '<td><span class="admin-request-status ' +
            status.className +
            '">' +
            escapeHtml(t(status.key)) +
            "</span></td>",
          "<td>" + createdAt + "</td>",
          "<td>" + ip + "</td>",
          '<td class="admin-request-path" title="' +
            requestPathRaw +
            '">' +
            requestPath +
            "</td>",
          '<td><button type="button" class="admin-request-agent-button" data-user-agent="' +
            userAgent +
            '">' +
            userAgentShort +
            "</button></td>",
          '<td class="admin-request-actions"><button type="button" class="admin-request-action-button is-state-action" data-action="' +
            escapeHtml(status.action) +
            '" data-guest-email="' +
            guestEmailRaw +
            '" aria-label="' +
            escapeHtml(actionLabel) +
            '" title="' +
            escapeHtml(actionLabel) +
            '">' +
            actionIcon +
            "</button>" +
            expiredGrantButton +
            copyLinkButton +
            '<button type="button" class="admin-request-action-button is-delete" data-action="delete" data-guest-email="' +
            guestEmailRaw +
            '" aria-label="' +
            escapeHtml(t("invite_requests_action_delete")) +
            '" title="' +
            escapeHtml(t("invite_requests_action_delete")) +
            '"><svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button></td>',
          "</tr>",
        ].join("");
      })
      .join("");

    const emptyHtml = state.inviteRequestsLoading
      ? loadingHtml
      : filteredRequests.length === 0
        ? '<p class="admin-request-empty">' +
          (requests.length > 0
            ? t("invite_requests_no_match")
            : t("invite_requests_empty")) +
          "</p>"
        : '<div class="admin-request-table-wrap"><table class="admin-request-table"><thead><tr><th>' +
          t("invite_requests_col_no") +
          "</th><th>" +
          t("invite_requests_col_email") +
          "</th><th>" +
          t("invite_requests_col_count") +
          "</th><th>" +
          t("invite_requests_col_status") +
          "</th><th>" +
          t("invite_requests_col_created") +
          "</th><th>" +
          t("invite_requests_col_ip") +
          "</th><th>" +
          t("invite_requests_col_path") +
          "</th><th>" +
          t("invite_requests_col_agent") +
          "</th><th>" +
          t("invite_requests_col_action") +
          "</th></tr></thead><tbody>" +
          rows +
          "</tbody></table></div>" +
          renderInviteRequestPagination(totalRequests);

    $adminPlaceholderForm.html(
      '<section class="admin-request-panel">' +
        '<header class="admin-request-panel-header">' +
        "<div>" +
        '<p class="admin-request-kicker">' +
        t("invite_requests_kicker") +
        "</p>" +
        '<h3 class="admin-request-title">' +
        t("invite_requests_title") +
        "</h3>" +
        '<p class="admin-request-subtitle">' +
        t("invite_requests_subtitle") +
        "</p>" +
        "</div>" +
        '<button id="invite-requests-refresh" type="button" class="admin-request-refresh">' +
        t("invite_requests_refresh") +
        "</button>" +
        "</header>" +
        renderInviteRequestSearchForm() +
        emptyHtml +
        "</section>",
    );

    $("#invite-requests-refresh").on("click", function () {
      loadInviteRequests(true);
    });
    $("#invite-request-search-submit").on("click", function (event) {
      event.preventDefault();
      const $container = $("#invite-request-search-form");
      setInviteRequestFilters(getInviteRequestFiltersFromForm($container));
      state.inviteRequestPage = 1;
      renderAdminRequestsPanel();
    });
    function resetInviteRequestFilters() {
      setInviteRequestFilters({
        email: "",
        status: "",
        count: "",
        created: "",
        ip: "",
        path: "",
        agent: "",
      });
      state.inviteRequestPage = 1;
      renderAdminRequestsPanel();
    }
    $("#invite-request-search-reset").on("click", resetInviteRequestFilters);
    $("#invite-request-search-reset-header").on("click", function () {
      loadInviteRequests(true);
    });
    $("#invite-request-page-size").on("change", function () {
      setInviteRequestPageSize($(this).val());
      renderAdminRequestsPanel();
    });
    $(".admin-request-pagination-page, .admin-request-pagination-nav").on(
      "click",
      function () {
        const nextPage = Number($(this).attr("data-page"));
        if (!Number.isFinite(nextPage)) {
          return;
        }
        state.inviteRequestPage = nextPage;
        renderAdminRequestsPanel();
      },
    );

    function toggleInviteRequestSearchDetails() {
      const $details = $(".admin-request-search-details");
      const collapsed = !$details.hasClass("is-collapsed");
      state.inviteSearchCollapsed = collapsed;
      $details.toggleClass("is-collapsed", collapsed);
      $("#invite-request-search-toggle").attr(
        "aria-expanded",
        (!collapsed).toString(),
      );
    }

    $("#invite-request-search-toggle").on("click", function (event) {
      event.stopPropagation();
      toggleInviteRequestSearchDetails();
    });
    $(".admin-request-search-header").on("click", function (event) {
      const $target = $(event.target);
      if ($target.closest("button, input, select, label").length) {
        return;
      }
      toggleInviteRequestSearchDetails();
    });
  }

  function loadInviteRequests(forceReload) {
    if (state.pageMode !== "admin") {
      return $.Deferred().resolve(null).promise();
    }
    if (state.inviteRequestsLoading) {
      return $.Deferred().resolve(null).promise();
    }
    if (
      !forceReload &&
      Array.isArray(state.inviteRequests) &&
      state.inviteRequests.length > 0
    ) {
      renderAdminRequestsPanel();
      return $.Deferred().resolve(state.inviteRequests).promise();
    }

    state.inviteRequestsLoading = true;
    renderAdminRequestsPanel();
    $adminPlaceholderForm.find(".admin-request-panel").addClass("is-loading");

    return $.getJSON(buildApiUrl("__invite_requests__"))
      .then(function (data) {
        state.inviteRequests = Array.isArray(data && data.requests)
          ? data.requests
          : [];
        state.adminPanel = "requests";
        return state.inviteRequests;
      })
      .fail(function () {
        state.inviteRequests = [];
        state.adminPanel = "requests";
        showResultModal(t("invite_requests_fail"), "error");
      })
      .always(function () {
        state.inviteRequestsLoading = false;
        renderAdminRequestsPanel();
        $adminPlaceholderForm
          .find(".admin-request-panel")
          .removeClass("is-loading");
      });
  }

  function updateGuestInviteUi() {
    $guestInviteForm.find("[data-i18n]").each(function () {
      const key = $(this).attr("data-i18n");
      if (key) {
        $(this).text(t(key));
      }
    });
    $guestInviteForm.find("[data-i18n-placeholder]").each(function () {
      const key = $(this).attr("data-i18n-placeholder");
      if (key) {
        $(this).attr("placeholder", t(key));
      }
    });
    $guestEmail.attr("aria-label", t("guest_email_label"));
    const submitLabel = guestTokenLoginMode
      ? t("guest_admin_login")
      : t("guest_submit");
    $guestInviteSubmit
      .text(submitLabel)
      .attr("aria-label", submitLabel)
      .attr("title", submitLabel);
    $guestGateSubtitle.text(
      guestTokenLoginMode ? t("guest_token_prompt") : t("guest_subtitle"),
    );
  }

  function updateStaticTexts() {
    $("html").attr("lang", state.lang);
    const isAdminPage = state.pageMode === "admin";
    document.title = isAdminPage
      ? t("admin_page_title")
      : state.authUser
        ? t("sidebar_title")
        : t("guest_page_title");
    $sidebarTitle.text(t("sidebar_title"));
    $sidebarHint.html(t("sidebar_hint"));
    $settingsToggle
      .removeClass("is-hidden")
      .attr("aria-label", t("settings_button"));
    if (isAdminPage) {
      $settingsPanel.addClass("is-hidden");
    }
    $albumUploadButton
      .attr("aria-label", t("upload_album_button"))
      .attr("title", t("upload_album_button"))
      .find(".text")
      .text(t("upload_album_button"));
    $audioUploadButton
      .attr("aria-label", t("upload_audio_button"))
      .attr("title", t("upload_audio_button"))
      .find(".text")
      .text(t("upload_audio_button"));
    $("#audio-upload-modal-title").text(t("upload_audio_modal_title"));
    $audioColNo.text(t("upload_audio_col_no"));
    $audioColTitle.text(t("upload_audio_col_title"));
    $audioColAction.text(t("upload_audio_col_action"));
    $audioListEmpty.text(t("upload_audio_list_empty"));
    $audioUploadFilesLabel.text(t("upload_audio_files_label"));
    $audioUploadHelpText.text(t("upload_audio_help"));
    $audioUploadPlayAll.text(
      state.previewAudioAutoAdvance ? t("audio_stop_all") : t("audio_play_all"),
    );
    $audioUploadPlayAll.toggleClass(
      "is-active",
      state.previewAudioAutoAdvance,
    );
    $audioUploadCancel.text(t("upload_cancel"));
    $audioUploadSubmit
      .attr("aria-label", t("upload_audio_submit"))
      .attr("title", t("upload_audio_submit"));
    $audioPreviewToggle
      .attr("aria-label", t("audio_preview_play"))
      .attr("title", t("audio_preview_play"));
    $audioPreviewPrev
      .attr("aria-label", t("audio_preview_prev"))
      .attr("title", t("audio_preview_prev"));
    $audioPreviewNext
      .attr("aria-label", t("audio_preview_next"))
      .attr("title", t("audio_preview_next"));
    $audioPreviewVolumeToggle
      .attr("aria-label", t("audio_preview_volume"))
      .attr("title", t("audio_preview_volume"));
    $audioPreviewVolumeRange.attr("aria-label", t("audio_preview_volume"));
    $audioPreviewClose
      .attr("aria-label", t("audio_preview_close"))
      .attr("title", t("audio_preview_close"));
    $(".thumb-delete")
      .attr("aria-label", t("image_delete"))
      .attr("title", t("image_delete"));
    setPreviewPlaying(state.previewAudioPlaying);
    updatePreviewVolumeControls();
    $("#upload-modal-title").text(t("upload_modal_title"));
    $("#upload-album-label").text(t("upload_album_label"));
    $uploadAlbumName.attr("placeholder", t("upload_album_placeholder"));
    $("#upload-type-label").text(t("upload_type_label"));
    $uploadTypeOptions
      .find("[data-upload-type='files']")
      .text(t("upload_type_files"));
    $uploadTypeOptions
      .find("[data-upload-type='folder']")
      .text(t("upload_type_folder"));
    $uploadTypeOptions
      .find("[data-upload-type='zip']")
      .text(t("upload_type_zip"));
    $uploadCancel.text(t("upload_cancel"));
    $uploadSubmit.text(t("upload_submit"));
    $confirmModalTitle.text(t("confirm_title"));
    $confirmNo.text(t("confirm_no"));
    $confirmYes.text(t("confirm_yes"));
    $albumSearchInput.attr("placeholder", t("search_placeholder"));
    $languageLabel.text(t("language_label"));
    $themeSectionLabel.text(t("theme_label"));
    $modeLabel.text(t("mode_label"));
    $colorLabel.text(t("color_label"));
    $radiusLabel.text(t("radius_label"));
    $sidebarEditPage
      .attr("aria-label", t("edit_page_label"))
      .attr("title", t("edit_page_label"))
      .find(".text")
      .text(t("edit_page_label"));
    $sidebarEditSave
      .attr("aria-label", t("edit_save_label"))
      .attr("title", t("edit_save_label"));
    $sidebarEditCancel
      .attr("aria-label", t("edit_cancel_label"))
      .attr("title", t("edit_cancel_label"));
    $settingsLogout
      .attr("aria-label", t("logout_label"))
      .attr("title", t("logout_label"))
      .find(".text")
      .text(t("logout_label"));
    $albumSlideshowToggle
      .attr("aria-label", t("slideshow_start"))
      .attr("title", t("slideshow_start"));
    $albumSortToggle
      .attr("aria-label", t("sort_label"))
      .attr("title", t("sort_label"));
    updateAdminNavUi();
    updateInviteRequestsButtonUi();
    updateGuestInviteUi();
    updateAudioToggleState();
    renderLanguageSwitches();
    renderThemeOptions();
    renderColorOptions();
    renderRadiusControl();
    renderSortMenu();
    syncUploadTypeUi();
    applySidebarState();
    if (state.adminPanel === "requests") {
      renderAdminRequestsPanel();
    }
  }

  function closeSortMenu() {
    $albumSortMenu.addClass("is-hidden").attr("aria-hidden", "true");
    $albumSortToggle.removeClass("is-open");
  }

  function renderSortMenu() {
    $albumSortMenu.empty();
    sortModeDefs.forEach(function (item) {
      const $btn = $(
        "<button type='button' class='album-sort-option'></button>",
      )
        .attr("data-sort-mode", item.value)
        .text(t(item.labelKey))
        .toggleClass("is-active", state.sortMode === item.value);
      $albumSortMenu.append($btn);
    });
  }

  function updateScrollTopVisibility() {
    const scrollTop =
      window.pageYOffset || document.documentElement.scrollTop || 0;
    $scrollTop.toggleClass("is-visible", scrollTop > 280);
  }

  function getNormalizedSortMode(mode) {
    const raw = String(mode || "").trim();
    return sortModes.includes(raw) ? raw : "time_desc";
  }

  function normalizeTimestamp(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      return 0;
    }
    return Math.floor(num);
  }

  function extractTimestampFromName(fileName) {
    const name = String(fileName || "").trim();
    if (!name) {
      return 0;
    }
    const base = name.replace(/\.[^.]+$/, "");
    const patterns = [
      /(\d{4})[-_](\d{2})[-_](\d{2})[ T_-](\d{2})[.:_-](\d{2})[.:_-](\d{2})/,
      /(\d{4})(\d{2})(\d{2})[ T_-]?(\d{2})(\d{2})(\d{2})/,
    ];
    for (let i = 0; i < patterns.length; i += 1) {
      const match = base.match(patterns[i]);
      if (!match) {
        continue;
      }
      const ts = new Date(
        Number(match[1]),
        Math.max(0, Number(match[2]) - 1),
        Number(match[3]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6]),
      ).getTime();
      if (Number.isFinite(ts) && ts > 0) {
        return Math.floor(ts / 1000);
      }
    }
    return 0;
  }

  function compareNaturalText(a, b) {
    return String(a || "").localeCompare(String(b || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }

  function sortImageEntries(entries) {
    const mode = getNormalizedSortMode(state.sortMode);
    return (Array.isArray(entries) ? entries.slice() : []).sort(
      function (a, b) {
        const left = normalizeImageEntry(a);
        const right = normalizeImageEntry(b);
        const leftName = left.original || left.name || "";
        const rightName = right.original || right.name || "";
        const leftTime =
          left.uploadedAt || left.createdAt || left.nameTime || 0;
        const rightTime =
          right.uploadedAt || right.createdAt || right.nameTime || 0;

        if (mode === "time_asc" || mode === "time_desc") {
          if (leftTime !== rightTime) {
            return mode === "time_asc"
              ? leftTime - rightTime
              : rightTime - leftTime;
          }
          return compareNaturalText(leftName, rightName);
        }
        if (mode === "name_desc") {
          const nameCmpDesc = compareNaturalText(rightName, leftName);
          if (nameCmpDesc !== 0) {
            return nameCmpDesc;
          }
          return rightTime - leftTime;
        }
        const nameCmp = compareNaturalText(leftName, rightName);
        if (nameCmp !== 0) {
          return nameCmp;
        }
        return rightTime - leftTime;
      },
    );
  }

  function getCurrentSlideshowItems() {
    return buildViewerItems();
  }

  function updateSlideshowButtonState() {
    const hasItems = getCurrentSlideshowItems().length > 0;
    $albumSlideshowToggle.prop("disabled", !hasItems);
    $albumSlideshowToggle.toggleClass("is-playing", state.slideshowPlaying);
    $albumSlideshowToggle
      .attr("aria-label", t("slideshow_start"))
      .attr("title", t("slideshow_start"));
    $imageViewerSlideshowToggle
      .toggleClass("is-paused", !state.slideshowPlaying)
      .attr(
        "aria-label",
        state.slideshowPlaying ? t("slideshow_stop") : t("slideshow_start"),
      )
      .attr(
        "title",
        state.slideshowPlaying ? t("slideshow_stop") : t("slideshow_start"),
      );
    updateAudioToggleState();
  }

  function updateAudioToggleState() {
    const hasAudio = state.slideshowAudioList.length > 0;
    const volume = Number.isFinite(state.slideshowAudioVolume)
      ? state.slideshowAudioVolume
      : 0;
    const label =
      volume <= 0 ? t("slideshow_music_on") : t("slideshow_music_off");
    let levelClass = "volume-level-4";
    if (volume <= 0) {
      levelClass = "volume-level-0";
    } else if (volume < 0.25) {
      levelClass = "volume-level-1";
    } else if (volume < 0.5) {
      levelClass = "volume-level-2";
    } else if (volume < 0.75) {
      levelClass = "volume-level-3";
    }
    $imageViewerAudioToggle
      .removeClass(
        "volume-level-0 volume-level-1 volume-level-2 volume-level-3 volume-level-4",
      )
      .addClass(levelClass)
      .prop("disabled", !state.slideshowMode || !hasAudio)
      .attr("aria-label", label)
      .attr("title", label);
    $imageViewerAudioRange.prop("disabled", !state.slideshowMode || !hasAudio);
    const sliderStep = Math.round(
      Math.max(0, Math.min(4, Math.round(volume * 4))),
    );
    $imageViewerAudioRange.val(sliderStep);
  }

  function pauseSlideshowAudio(reset) {
    try {
      slideshowAudio.pause();
      if (reset) {
        slideshowAudio.currentTime = 0;
      }
    } catch (_err) {
      // Ignore audio state errors.
    }
  }

  function getSlideshowAudioSrc(name) {
    const safeName = String(name || "").replace(/^\/+/, "");
    return buildApiUrl("__audio__/" + safeName);
  }

  previewAudio.addEventListener("error", function () {
    const err = previewAudio.error;
    if (err) {
      console.error(
        "Audio preview failed to load:",
        err.code,
        err.message || err.name,
      );
    } else {
      console.error(
        "Audio preview failed to load for file:",
        state.previewAudioFile,
      );
    }
    setPreviewPlaying(false);
    if (state.previewAudioAutoAdvance) {
      playNextPreviewAudio();
    }
  });

  function playSlideshowAudio() {
    if (!state.slideshowAudioList.length) {
      return;
    }
    if (state.slideshowAudioIndex >= state.slideshowAudioList.length) {
      state.slideshowAudioIndex = 0;
    }
    const name = state.slideshowAudioList[state.slideshowAudioIndex];
    const nextSrc = getSlideshowAudioSrc(name);
    const volume = Number.isFinite(state.slideshowAudioVolume)
      ? state.slideshowAudioVolume
      : 0;
    if (volume <= 0) {
      pauseSlideshowAudio(false);
      return;
    }
    if (slideshowAudio.src !== nextSrc) {
      slideshowAudio.src = nextSrc;
    }
    slideshowAudio.volume = Math.max(0, Math.min(1, volume));
    slideshowAudio.muted = slideshowAudio.volume <= 0;
    slideshowAudio.play().catch(function () {
      // Autoplay might be blocked; ignore silently.
    });
  }

  function ensureSlideshowAudioList(options) {
    const opts = options || {};
    if (slideshowAudioRequest) {
      return slideshowAudioRequest;
    }
    slideshowAudioRequest = $.getJSON(buildApiUrl("__list_audio_public__"))
      .done(function (response) {
        const files =
          response && response.ok && Array.isArray(response.files)
            ? response.files
            : [];
        const orderedFiles = files.slice();
        state.slideshowAudioList = orderedFiles;
        if (!orderedFiles.length) {
          pauseSlideshowAudio(true);
          updateAudioToggleState();
          if (opts.showEmpty) {
            showResultModal(t("slideshow_audio_empty"), "warning");
          }
          return;
        }
        if (state.slideshowAudioIndex >= orderedFiles.length) {
          state.slideshowAudioIndex = 0;
        }
        updateAudioToggleState();
        if (opts.autoplay) {
          playSlideshowAudio();
        }
      })
      .fail(function (xhr) {
        state.slideshowAudioList = [];
        pauseSlideshowAudio(true);
        updateAudioToggleState();
        if (opts.showEmpty) {
          if (xhr && xhr.status === 401) {
            showResultModal(t("upload_audio_auth_required"), "warning");
          } else {
            showResultModal(t("slideshow_audio_empty"), "warning");
          }
        }
      })
      .always(function () {
        slideshowAudioRequest = null;
      });
    return slideshowAudioRequest;
  }

  function setSlideshowAudioVolume(value) {
    const volume = Math.max(0, Math.min(1, Number(value) || 0));
    state.slideshowAudioVolume = volume;
    slideshowAudio.volume = volume;
    slideshowAudio.muted = volume <= 0;
    localStorage.setItem("album-viewer-slideshow-audio-volume", String(volume));
    if (volume > 0) {
      state.slideshowAudioLastVolume = volume;
      localStorage.setItem(
        "album-viewer-slideshow-audio-last-volume",
        String(volume),
      );
    }
    updateAudioToggleState();
  }

  function toggleSlideshowAudioMute() {
    const current = Number.isFinite(state.slideshowAudioVolume)
      ? state.slideshowAudioVolume
      : 0;
    if (current > 0) {
      setSlideshowAudioVolume(0);
      return;
    }
    const fallback =
      Number.isFinite(state.slideshowAudioLastVolume) &&
      state.slideshowAudioLastVolume > 0
        ? state.slideshowAudioLastVolume
        : 0.6;
    setSlideshowAudioVolume(fallback);
    if (state.slideshowMode && state.slideshowPlaying) {
      playSlideshowAudio();
    }
  }

  slideshowAudio.addEventListener("ended", function () {
    if (!state.slideshowAudioList.length) {
      return;
    }
    state.slideshowAudioIndex =
      (state.slideshowAudioIndex + 1) % state.slideshowAudioList.length;
    playSlideshowAudio();
  });

  function formatAudioTime(seconds) {
    const safe = Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
    const mins = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return mins + ":" + String(secs).padStart(2, "0");
  }

  let pendingPreviewSeek = null;
  let isPreviewSeeking = false;

  function updatePreviewProgress() {
    const duration = Number.isFinite(previewAudio.duration)
      ? previewAudio.duration
      : 0;
    const current = Number.isFinite(previewAudio.currentTime)
      ? previewAudio.currentTime
      : 0;
    const ratio =
      duration > 0 ? Math.min(1, Math.max(0, current / duration)) : 0;
    $audioPreviewTime.text(
      formatAudioTime(current) + " / " + formatAudioTime(duration),
    );
    $audioPreviewProgress.css("width", (ratio * 100).toFixed(2) + "%");
    const pct = (ratio * 100).toFixed(2);
    if (!isPreviewSeeking) {
      $audioPreviewSeek.val(pct);
      $audioPreviewSeek.css("--seek", pct + "%");
    }
  }

  function seekPreviewAudioByRatio(ratio) {
    let duration = Number.isFinite(previewAudio.duration)
      ? previewAudio.duration
      : 0;
    if (!Number.isFinite(duration) || duration <= 0) {
      const seekable = previewAudio.seekable;
      if (seekable && seekable.length) {
        duration = seekable.end(seekable.length - 1);
      }
    }
    if (
      !Number.isFinite(duration) ||
      duration <= 0 ||
      previewAudio.readyState < 1
    ) {
      pendingPreviewSeek = ratio;
      return;
    }
    const nextTime = Math.max(0, Math.min(duration, ratio * duration));
    const wasPlaying = state.previewAudioPlaying;
    if (typeof previewAudio.fastSeek === "function") {
      try {
        previewAudio.fastSeek(nextTime);
      } catch (_err) {
        previewAudio.currentTime = nextTime;
      }
    } else {
      previewAudio.currentTime = nextTime;
    }
    updatePreviewProgress();
    if (wasPlaying) {
      previewAudio
        .play()
        .then(function () {
          setPreviewPlaying(true);
        })
        .catch(function () {});
    }
    if (ratio > 0.001) {
      setTimeout(function () {
        if (
          !Number.isFinite(previewAudio.currentTime) ||
          previewAudio.currentTime < 0.01
        ) {
          pendingPreviewSeek = ratio;
        }
      }, 120);
    }
  }

  function updatePreviewVolumeControls() {
    const volume = Number.isFinite(state.previewAudioVolume)
      ? state.previewAudioVolume
      : 0;
    $audioPreviewVolumeRange.val(Math.round(volume * 100));
    $audioPreviewVolumeToggle.toggleClass("is-muted", volume <= 0.001);
  }

  function setPreviewAudioVolume(value) {
    const volume = Math.max(0, Math.min(1, Number(value) || 0));
    state.previewAudioVolume = volume;
    previewAudio.volume = volume;
    previewAudio.muted = volume <= 0;
    localStorage.setItem(
      "album-viewer-preview-audio-volume",
      volume.toFixed(2),
    );
    updatePreviewVolumeControls();
  }

  function setPreviewPanelOpen(open) {
    $audioPreviewPanel.toggleClass("is-open", false);
    $audioPreviewPanel.attr("aria-hidden", open ? "false" : "true");
    if (!open) {
      return;
    }
    requestAnimationFrame(function () {
      $audioPreviewPanel.toggleClass("is-open", true);
    });
  }

  function setPreviewPlaying(isPlaying) {
    state.previewAudioPlaying = !!isPlaying;
    $audioPreviewToggle.toggleClass("is-playing", state.previewAudioPlaying);
    $audioList.find(".audio-table-play").each(function () {
      const $btn = $(this);
      const match = $btn.attr("data-filename") === state.previewAudioFile;
      $btn.toggleClass("is-playing", match && state.previewAudioPlaying);
      $btn.attr(
        "aria-label",
        state.previewAudioPlaying && match
          ? t("audio_preview_pause")
          : t("audio_preview_play"),
      );
      $btn.attr(
        "title",
        state.previewAudioPlaying && match
          ? t("audio_preview_pause")
          : t("audio_preview_play"),
      );
    });
    $audioPreviewToggle
      .attr(
        "aria-label",
        state.previewAudioPlaying
          ? t("audio_preview_pause")
          : t("audio_preview_play"),
      )
      .attr(
        "title",
        state.previewAudioPlaying
          ? t("audio_preview_pause")
          : t("audio_preview_play"),
      );
    updatePreviewTrackControls();
  }

  function updatePreviewTrackControls() {
    const hasList = Array.isArray(state.slideshowAudioList) &&
      state.slideshowAudioList.length > 0;
    const currentIndex = hasList
      ? state.slideshowAudioList.indexOf(state.previewAudioFile)
      : -1;
    const canPrev = hasList && currentIndex > 0;
    const canNext = hasList && currentIndex > -1 && currentIndex < state.slideshowAudioList.length - 1;
    $audioPreviewPrev
      .prop("disabled", !canPrev)
      .attr("aria-label", t("audio_preview_prev"))
      .attr("title", t("audio_preview_prev"));
    $audioPreviewNext
      .prop("disabled", !canNext)
      .attr("aria-label", t("audio_preview_next"))
      .attr("title", t("audio_preview_next"));
  }

  function updateAudioUploadPlayAllButton() {
    if (!$audioUploadPlayAll.length) {
      return;
    }
    $audioUploadPlayAll
      .text(state.previewAudioAutoAdvance ? t("audio_stop_all") : t("audio_play_all"))
      .toggleClass("is-active", state.previewAudioAutoAdvance);
  }

  function stopPreviewAutoAdvance() {
    state.previewAudioAutoAdvance = false;
    updateAudioUploadPlayAllButton();
  }

  function startPreviewAutoAdvance() {
    stopPreviewAudio(true);
    state.previewAudioFile = "";
    clearPreviewAnchor();
    state.previewAudioAutoAdvance = true;
    updateAudioUploadPlayAllButton();
    if (!state.slideshowAudioList.length) {
      loadAudioList();
      return;
    }
    playPreviewAudio(state.slideshowAudioList[0]);
  }

  function playNextPreviewAudio() {
    if (!state.previewAudioAutoAdvance || !state.slideshowAudioList.length) {
      stopPreviewAutoAdvance();
      return;
    }
    const currentIndex = state.slideshowAudioList.indexOf(state.previewAudioFile);
    const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
    if (nextIndex < state.slideshowAudioList.length) {
      playPreviewAudio(state.slideshowAudioList[nextIndex]);
      return;
    }
    stopPreviewAutoAdvance();
  }

  function playPreviewTrackByOffset(offset) {
    if (!Array.isArray(state.slideshowAudioList) || !state.slideshowAudioList.length) {
      return;
    }
    const currentIndex = state.slideshowAudioList.indexOf(state.previewAudioFile);
    let nextIndex = currentIndex;
    if (currentIndex < 0) {
      nextIndex = offset > 0 ? 0 : state.slideshowAudioList.length - 1;
    } else {
      nextIndex = currentIndex + offset;
    }
    nextIndex = Math.max(0, Math.min(state.slideshowAudioList.length - 1, nextIndex));
    const nextFilename = state.slideshowAudioList[nextIndex];
    if (nextFilename) {
      playPreviewAudio(nextFilename);
    }
  }

  function stopPreviewAudio(reset) {
    try {
      previewAudio.pause();
      if (reset) {
        previewAudio.currentTime = 0;
      }
    } catch (_err) {
      // Ignore audio state errors.
    }
    setPreviewPlaying(false);
    updatePreviewProgress();
    updatePreviewTrackControls();
  }

  function clearPreviewAnchor() {
    if (state.previewAnchorRow) {
      state.previewAnchorRow.removeClass("is-preview-row");
    }
    if ($audioPreviewPanel.length) {
      $audioPreviewPanel.removeClass("inline");
      $audioPreviewPanel.css({
        top: "",
        height: "",
        left: "",
        width: "",
        position: "",
      });
      if ($audioPreviewHome && $audioPreviewHome.length) {
        $audioPreviewHome.append($audioPreviewPanel);
      }
    }
    state.previewAnchorRow = null;
    state.previewAnchorSlot = null;
  }

  function ensurePreviewAnchor($row) {
    if (!$row || !$row.length) {
      return;
    }
    if (
      state.previewAnchorRow &&
      state.previewAnchorRow.get(0) === $row.get(0) &&
      state.previewAnchorSlot
    ) {
      return;
    }
    clearPreviewAnchor();
    state.previewAnchorRow = $row;
    state.previewAnchorRow.addClass("is-preview-row");
    $audioPreviewPanel.addClass("inline");
    $audioTableWrap.append($audioPreviewPanel);
    state.previewAnchorSlot = $audioTableWrap;
    updatePreviewOverlayPosition();
  }

  function updatePreviewOverlayPosition() {
    if (!state.previewAnchorRow || !$audioTableWrap.length) {
      return;
    }
    const rowEl = state.previewAnchorRow.get(0);
    const wrapEl = $audioTableWrap.get(0);
    if (!rowEl || !wrapEl) {
      return;
    }
    const tableEl = rowEl.closest("table");
    const wrapRect = wrapEl.getBoundingClientRect();
    const $tbody = $(tableEl).find("tbody");
    const rowIndex = $tbody.find("tr").index(rowEl);
    const baseTop = 30;
    const rowStep = 35;
    const panelHeight = 50;
    const insetX = 8;
    const top =
      wrapRect.top +
      baseTop +
      Math.max(0, rowIndex) * rowStep -
      (wrapEl.scrollTop || 0);
    $audioPreviewPanel.css({
      position: "fixed",
      top: Math.max(0, top).toFixed(2) + "px",
      height: panelHeight.toFixed(2) + "px",
      left: (wrapRect.left + insetX).toFixed(2) + "px",
      width: Math.max(0, wrapRect.width - insetX * 2).toFixed(2) + "px",
    });
  }

  function updateAudioTableWrapLimit(count) {
    if (!$audioTableWrap.length) {
      return;
    }
    if (count > 5) {
      const rowHeight = 52;
      const headerHeight = 42;
      const target = headerHeight + rowHeight * 5 + 2;
      $audioTableWrap.css({
        "max-height": target + "px",
        "overflow-y": "auto",
      });
      return;
    }
    $audioTableWrap.css({ "max-height": "none", "overflow-y": "hidden" });
  }

  function closePreviewPanel() {
    stopPreviewAudio(true);
    stopPreviewAutoAdvance();
    setPreviewPanelOpen(false);
    state.previewAudioFile = "";
    clearPreviewAnchor();
  }

  function playPreviewAudio(filename) {
    if (!filename) {
      return;
    }
    updatePreviewOverlayPosition();
    setPreviewAudioVolume(state.previewAudioVolume);
    const nextSrc = getSlideshowAudioSrc(filename);
    const isSame =
      state.previewAudioFile === filename && previewAudio.src === nextSrc;
    state.previewAudioFile = filename;
    $audioPreviewTitle.text(filename);
    setPreviewPanelOpen(true);
    if (!isSame) {
      previewAudio.pause();
      previewAudio.src = nextSrc;
      previewAudio.currentTime = 0;
    }
    previewAudio
      .play()
      .then(function () {
        setPreviewPlaying(true);
      })
      .catch(function () {
        setPreviewPlaying(false);
      });
    updatePreviewTrackControls();
  }

  previewAudio.addEventListener("timeupdate", function () {
    applyPendingPreviewSeek();
    updatePreviewProgress();
  });
  function applyPendingPreviewSeek() {
    if (pendingPreviewSeek === null) {
      return;
    }
    const ratio = pendingPreviewSeek;
    pendingPreviewSeek = null;
    seekPreviewAudioByRatio(ratio);
  }

  previewAudio.addEventListener("loadedmetadata", function () {
    applyPendingPreviewSeek();
    updatePreviewProgress();
  });

  previewAudio.addEventListener("loadeddata", function () {
    applyPendingPreviewSeek();
  });

  previewAudio.addEventListener("canplay", function () {
    applyPendingPreviewSeek();
  });
  previewAudio.addEventListener("ended", function () {
    setPreviewPlaying(false);
    if (state.previewAudioAutoAdvance) {
      playNextPreviewAudio();
    }
  });

  $audioTableWrap.on("scroll", function () {
    updatePreviewOverlayPosition();
  });
  $(window).on("resize", function () {
    updatePreviewOverlayPosition();
  });

  function canManageAudioOrder() {
    return (
      state.authUser &&
      state.authRole &&
      state.authRole.toLowerCase() === "admin"
    );
  }

  function updateAudioRowNumbers() {
    $audioList.find("tr.audio-table-row").each(function (index) {
      $(this)
        .find(".audio-col-no")
        .text(String(index + 1));
    });
  }

  function updateAudioOrderFromDom() {
    const order = [];
    $audioList.find("tr.audio-table-row").each(function () {
      const name = $(this).attr("data-filename");
      if (name) {
        order.push(name);
      }
    });
    if (order.length) {
      state.slideshowAudioList = order.slice();
      if (canManageAudioOrder()) {
        $.ajax({
          url: buildApiUrl("__audio_order__"),
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify({ order: order }),
          dataType: "json",
        }).fail(function () {
          loadAudioList();
        });
      }
    }
    updateAudioRowNumbers();
    updatePreviewOverlayPosition();
  }

  function updateSlideshowCounter() {
    const total = state.viewerItems.length;
    if (!total || state.viewerIndex < 0) {
      $imageViewerSlideshowCounter.text("0 / 0");
      return;
    }
    $imageViewerSlideshowCounter.text(
      String(state.viewerIndex + 1) + " / " + String(total),
    );
  }

  function updateSearchClearState() {
    const hasValue = String($albumSearchInput.val() || "").trim().length > 0;
    $(".sidebar-search").toggleClass("has-value", hasValue);
    $albumSearchClear.toggleClass("is-hidden", !hasValue);
  }

  function setEditingPage(enabled) {
    const next = !!enabled;
    if (state.editingPage === next) {
      return;
    }
    state.editingPage = next;
    if (!state.editingPage) {
      resetHiddenDrafts();
      resetHiddenImageDrafts();
    }
    $("body").toggleClass("is-page-editing", next);
    $sidebarEditPage.toggleClass("is-hidden", state.editingPage);
    $sidebarEditSave.toggleClass("is-hidden", !state.editingPage);
    $sidebarEditCancel.toggleClass("is-hidden", !state.editingPage);
    renderAlbumList();
  }

  function updateAuthUi() {
    const username = String(state.authUser || "").trim();
    const role = String(state.authRole || "").trim();
    const isAdmin = role.toLowerCase() === "admin";
    renderSidebarAvatarIcon();
    if (!username) {
      $sidebarUserName.text("");
      $sidebarUserProfile.addClass("is-hidden");
      $sidebarEditPage.removeClass("is-hidden");
      $sidebarEditSave.addClass("is-hidden");
      $sidebarEditCancel.addClass("is-hidden");
      resetHiddenDrafts();
      resetHiddenImageDrafts();
      state.editingPage = false;
      $("body").removeClass("is-page-editing");
      $settingsLogout.addClass("is-hidden").prop("disabled", true);
      $albumUploadButton.addClass("is-hidden").prop("disabled", true);
      $audioUploadButton.addClass("is-hidden").prop("disabled", true);
      $invitationLinkButton.addClass("is-hidden").prop("disabled", true);
      if ($adminNavButton.length) {
        $adminNavButton.addClass("is-hidden");
      }
      if ($inviteRequestsButton.length) {
        $inviteRequestsButton.addClass("is-hidden");
      }
      state.authRole = "";
      state.adminPanel = "";
      state.inviteRequests = [];
      state.inviteRequestsLoading = false;
      state.invitationLinks = [];
      state.invitationLinksLoading = false;
      updateAdminUserClass();
      closeUploadModal();
      closeAudioUploadModal();
      closeInvitationLinkModal();
      renderAlbumList();
      return;
    }
    const displayName = role ? username + " (" + role + ")" : username;
    const safeUser = $("<div></div>").text(username).html();
    const safeRole = $("<div></div>").text(role).html();
    const html = role
      ? '<span class="sidebar-user-username">' +
        safeUser +
        '</span> <span class="sidebar-user-role">(' +
        safeRole +
        ")</span>"
      : '<span class="sidebar-user-username">' + safeUser + "</span>";
    $sidebarUserName.html(html).attr("title", displayName);
    $sidebarUserProfile.removeClass("is-hidden");
    if (!isAdmin && state.editingPage) {
      resetHiddenDrafts();
      resetHiddenImageDrafts();
      state.editingPage = false;
      $("body").removeClass("is-page-editing");
    }
    $sidebarEditPage.toggleClass("is-hidden", state.editingPage);
    $sidebarEditSave.toggleClass("is-hidden", !state.editingPage);
    $sidebarEditCancel.toggleClass("is-hidden", !state.editingPage);
    $sidebarEditPage.toggle(isAdmin);
    if (!isAdmin) {
      $sidebarEditSave.addClass("is-hidden");
      $sidebarEditCancel.addClass("is-hidden");
    }
    $settingsLogout.removeClass("is-hidden").prop("disabled", false);
    if (state.pageMode === "admin" && isAdmin) {
      $albumUploadButton.removeClass("is-hidden").prop("disabled", false);
      $audioUploadButton.removeClass("is-hidden").prop("disabled", false);
      $invitationLinkButton.removeClass("is-hidden").prop("disabled", false);
    } else {
      $albumUploadButton.addClass("is-hidden").prop("disabled", true);
      $audioUploadButton.addClass("is-hidden").prop("disabled", true);
      $invitationLinkButton.addClass("is-hidden").prop("disabled", true);
      closeUploadModal();
      closeAudioUploadModal();
      closeInvitationLinkModal();
    }
    $(".thumb-delete").toggleClass("is-hidden", !isAdmin);
    updateAdminNavUi();
    updateInviteRequestsButtonUi();
    updateInvitationLinkButtonUi();
    updateAdminUserClass();
    renderAlbumList();
  }

  function closeUploadModal() {
    $uploadModal.addClass("is-hidden").attr("aria-hidden", "true");
    $uploadError.text("");
    $uploadFilesInput.val("");
    $uploadFolderInput.val("");
    $uploadZipInput.val("");
  }

  function setGuestInviteMessage(text) {
    $guestInviteMessage.text(text || "");
  }

  function getGuestTokenFromQuery() {
    return String(
      new URLSearchParams(window.location.search || "").get("token") || "",
    ).trim();
  }

  function setGuestTokenMode(enabled, guestEmail, options) {
    const opts = options && typeof options === "object" ? options : {};
    guestTokenLoginMode = !!enabled;
    guestTokenValue = guestTokenLoginMode ? getGuestTokenFromQuery() : "";
    $("body").toggleClass("is-guest-token-login", guestTokenLoginMode);
    if (guestTokenLoginMode) {
      $guestGateSubtitle.text("");
      setGuestInviteMessage("");
    } else {
      $guestGateSubtitle.text(t("guest_subtitle"));
      if (opts.clearEmail) {
        $guestEmail.val("");
      }
      setGuestInviteMessage("");
    }
    updateGuestInviteUi();
  }

  function loadGuestTokenStatus() {
    const token = getGuestTokenFromQuery();
    if (!token) {
      return Promise.resolve();
    }

    guestTokenPending = true;
    $guestEmail.val("");
    setGuestTokenMode(true);
    lockGuestInviteForm(true);

    return $.getJSON(buildApiUrl("__guest_token_status__", { token: token }))
      .then(function (response) {
        if (response && response.ok) {
          setGuestTokenMode(true);
          return;
        }
        setGuestTokenMode(false, null, { clearEmail: true });
        showResultModal(t("guest_token_invalid"), "error");
      })
      .catch(function () {
        setGuestTokenMode(false, null, { clearEmail: true });
        showResultModal(t("guest_token_invalid"), "error");
      })
      .always(function () {
        guestTokenPending = false;
        lockGuestInviteForm(false);
      });
  }

  function lockGuestInviteForm(locked) {
    $guestInviteSubmit.prop("disabled", locked);
    $guestEmail.prop("disabled", locked);
  }

  function bindGuestInviteForm() {
    if (!$guestInviteForm.length) {
      return;
    }
    $guestInviteForm.on("submit", function (event) {
      event.preventDefault();
      const email = String($guestEmail.val() || "").trim();
      if (!email) {
        if (!guestTokenLoginMode) {
          setGuestInviteMessage(t("guest_missing"));
        }
        showResultModal(t("guest_missing"), "error");
        return;
      }

      setGuestInviteMessage("");
      lockGuestInviteForm(true);

      const queryToken = getGuestTokenFromQuery();
      const usingTokenLogin = guestTokenLoginMode || queryToken !== "";
      const tokenValue = guestTokenValue || queryToken;
      const requestUrl = usingTokenLogin
        ? buildApiUrl("__guest_token_login__", { token: tokenValue })
        : buildApiUrl("__invite_request__");
      const requestData = usingTokenLogin
        ? { token: tokenValue, email: email }
        : { email: email };

      $.ajax({
        url: requestUrl,
        method: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify(requestData),
      })
        .done(function (response) {
          if (response && response.ok) {
            if (guestTokenLoginMode) {
              const redirectUrl =
                String(response.redirect || "").trim() || "./";
              window.location.href = redirectUrl;
              return;
            }
            $guestEmail.val("");
            const successMessage =
              (response && response.message) || t("guest_sent");
            setGuestInviteMessage("");
            showResultModal(successMessage, "success");
            return;
          }
          const failMessage =
            (response && response.message) || t("guest_failed");
          if (!guestTokenLoginMode) {
            setGuestInviteMessage(failMessage);
          }
          showResultModal(failMessage, "error");
        })
        .fail(function (xhr) {
          const payload = xhr && xhr.responseJSON;
          const failMessage = (payload && payload.message) || t("guest_failed");
          if (!guestTokenLoginMode) {
            setGuestInviteMessage(failMessage);
          }
          showResultModal(failMessage, "error");
        })
        .always(function () {
          lockGuestInviteForm(false);
        });
    });
  }

  function bindAdminNavButton() {
    if (!$adminNavButton.length) {
      return;
    }
    $adminNavButton.on("click", function () {
      if (state.pageMode === "admin") {
        window.location.href = "./";
      } else {
        window.location.href = "./admin";
      }
    });
  }

  function bindInviteRequestsButton() {
    if (!$inviteRequestsButton.length) {
      return;
    }
    $inviteRequestsButton.on("click", function () {
      if (state.pageMode !== "admin") {
        return;
      }
      state.adminPanel = "requests";
      updateInviteRequestsButtonUi();
      loadInviteRequests(true);
    });
  }

  function bindInvitationLinkButton() {
    if (!$invitationLinkButton.length) {
      return;
    }
    $invitationLinkButton.on("click", function () {
      if (state.pageMode !== "admin") {
        return;
      }
      openInvitationLinkModal();
    });
  }

  function bindAdminRequestTooltipEvents() {
    $(document)
      .off("click.adminUserAgentTooltip")
      .on("click.adminUserAgentTooltip", function (event) {
        if (
          $(event.target).closest(
            ".admin-request-agent-button, .invitation-link-wish-item, #admin-user-agent-tooltip",
          ).length
        ) {
          return;
        }
        closeUserAgentTooltip();
      });

    $(document)
      .off("keydown.adminUserAgentTooltip")
      .on("keydown.adminUserAgentTooltip", function (event) {
        if (event.key === "Escape") {
          closeUserAgentTooltip();
        }
      });

    $(document)
      .off("click.adminUserAgentButton")
      .on(
        "click.adminUserAgentButton",
        ".admin-request-agent-button",
        function (event) {
          event.preventDefault();
          event.stopPropagation();
          const raw = String($(this).attr("data-user-agent") || "");
          showUserAgentTooltip(this, { user_agent: raw });
        },
      )
      .off("click.invitationLinkWishPreview")
      .on(
        "click.invitationLinkWishPreview",
        ".invitation-link-wish-item",
        function (event) {
          event.preventDefault();
          event.stopPropagation();
          const raw = String($(this).attr("data-full-message") || "").trim();
          if (!raw) {
            return;
          }
          showAdminDetailTooltip(this, {
            title: "Lời chúc",
            raw: raw,
            lines: [],
          });
        },
      );
  }

  function bindAdminRequestActionEvents() {
    $(document)
      .off("click.adminRequestAction")
      .on(
        "click.adminRequestAction",
        ".admin-request-action-button",
        function (event) {
          event.preventDefault();
          event.stopPropagation();

          const $button = $(this);
          const action = String($button.attr("data-action") || "")
            .trim()
            .toLowerCase();
          const guestEmail = String(
            $button.attr("data-guest-email") || "",
          ).trim();
          if (!action || !guestEmail) {
            return;
          }
          const actionLabel = getInviteRequestActionLabel(action);
          const token = String($button.attr("data-token") || "").trim();
          const requestPath = String(
            $button.attr("data-request-path") || "",
          ).trim();
          if (action === "copy") {
            if (!token) {
              showResultModal(t("invite_requests_copy_fail"), "error");
              return;
            }
            let copyUrl = requestPath || window.location.pathname;
            try {
              const urlObj = new URL(copyUrl, window.location.origin);
              if (urlObj.pathname.endsWith("/index.php")) {
                urlObj.pathname = urlObj.pathname.replace(/\/index\.php$/, "/");
              }
              if (urlObj.searchParams.get("route") === "__invite_request__") {
                urlObj.searchParams.delete("route");
              }
              urlObj.searchParams.set("token", token);
              copyUrl = urlObj.href;
            } catch (_err) {
              copyUrl =
                window.location.origin.replace(/\/$/, "") +
                "/" +
                copyUrl.replace(/^\/+/, "");
              copyUrl +=
                (copyUrl.indexOf("?") === -1 ? "?" : "&") +
                "token=" +
                encodeURIComponent(token);
            }
            copyTextToClipboard(copyUrl)
              .then(function () {
                showResultModal(t("invite_requests_copy_success"), "success");
              })
              .fail(function () {
                showResultModal(t("invite_requests_copy_fail"), "error");
              });
            return;
          }
          const confirmMessage = t("invite_requests_action_confirm", {
            action: actionLabel,
          });

          const executeAction = function (renewDays) {
            performInviteRequestAction(action, guestEmail, $button, renewDays)
              .then(function () {
                showResultModal(t("invite_requests_updated"), "success");
                return loadInviteRequests(true);
              })
              .fail(function (xhr) {
                const payload = xhr && xhr.responseJSON;
                const message =
                  (payload && payload.message) || t("invite_requests_fail");
                showResultModal(message, "error");
              });
          };

          const confirmOptions =
            action === "renew"
              ? { showRenewDays: true, defaultRenewDays: 7 }
              : {};
          openConfirmModal(
            action === "delete"
              ? t("invite_requests_delete_confirm")
              : confirmMessage,
            confirmOptions,
          ).then(function (confirmed) {
            if (!confirmed) {
              return;
            }
            const renewDays = confirmOptions.showRenewDays
              ? Number.isFinite(confirmOptions.selectedRenewDays)
                ? confirmOptions.selectedRenewDays
                : Number($confirmModalDays.val() || "")
              : undefined;
            executeAction(renewDays);
          });
        },
      );
  }

  function copyTextToClipboard(text) {
    const value = String(text || "");
    const deferred = $.Deferred();
    if (!value) {
      deferred.reject();
      return deferred.promise();
    }
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      navigator.clipboard
        .writeText(value)
        .then(function () {
          deferred.resolve(value);
        })
        .catch(function () {
          deferred.reject();
        });
      return deferred.promise();
    }
    const $textarea = $("<textarea>")
      .css({ position: "absolute", left: "-9999px", top: "0" })
      .attr("readonly", true)
      .val(value)
      .appendTo("body");
    $textarea[0].select();
    try {
      const success = document.execCommand("copy");
      $textarea.remove();
      if (success) {
        deferred.resolve(value);
      } else {
        deferred.reject();
      }
    } catch (_err) {
      $textarea.remove();
      deferred.reject();
    }
    return deferred.promise();
  }

  function performInviteRequestAction(action, guestEmail, $button, days) {
    const normalizedAction = String(action || "")
      .trim()
      .toLowerCase();
    const normalizedEmail = String(guestEmail || "").trim();
    if (!normalizedAction || !normalizedEmail) {
      return $.Deferred().reject().promise();
    }

    const payload = {
      action: normalizedAction,
      guest_email: normalizedEmail,
    };
    if (normalizedAction === "renew" && typeof days !== "undefined") {
      payload.days = Number(days) || undefined;
    }

    const request = $.ajax({
      url: buildApiUrl("__invite_request_action__"),
      method: "POST",
      dataType: "json",
      data: payload,
    });

    if ($button && $button.length) {
      $button.prop("disabled", true).addClass("is-loading");
    }

    return request
      .then(function (response) {
        if (!response || !response.ok) {
          throw response;
        }
        return response;
      })
      .always(function () {
        if ($button && $button.length) {
          $button.prop("disabled", false).removeClass("is-loading");
        }
      });
  }

  function loadAudioList() {
    if (!state.authUser) {
      return;
    }
    $audioUploadPlayAll.prop("disabled", true);
    $.getJSON(buildApiUrl("__list_audio__"))
      .done(function (data) {
        const files = Array.isArray(data && data.files) ? data.files : [];
        $audioUploadPlayAll.prop("disabled", files.length === 0);
        $audioList.empty();
        if (files.length === 0) {
          $("#audio-table-wrap").addClass("is-hidden");
          $audioListEmpty.removeClass("is-hidden");
          closePreviewPanel();
          updateAudioTableWrapLimit(0);
        } else {
          $("#audio-table-wrap").removeClass("is-hidden");
          $audioListEmpty.addClass("is-hidden");
          updateAudioTableWrapLimit(files.length);
          state.slideshowAudioList = files.slice();
          files.forEach(function (name, index) {
            const tr = document.createElement("tr");
            tr.className = "audio-table-row";
            tr.setAttribute("data-filename", name);
            tr.setAttribute(
              "draggable",
              canManageAudioOrder() ? "true" : "false",
            );
            const tdNo = document.createElement("td");
            tdNo.className = "audio-col-no";
            tdNo.textContent = index + 1;
            const tdTitle = document.createElement("td");
            tdTitle.className = "audio-col-title";
            const titleSpan = document.createElement("span");
            titleSpan.className = "audio-table-title";
            titleSpan.textContent = name;
            titleSpan.setAttribute("title", name);
            tdTitle.appendChild(titleSpan);
            const tdAction = document.createElement("td");
            tdAction.className = "audio-col-action";
            const actionWrap = document.createElement("div");
            actionWrap.className = "audio-table-actions";
            const playBtn = document.createElement("button");
            playBtn.type = "button";
            playBtn.className = "audio-table-play";
            playBtn.setAttribute("aria-label", t("audio_preview_play"));
            playBtn.setAttribute("title", t("audio_preview_play"));
            playBtn.setAttribute("data-filename", name);
            playBtn.innerHTML =
              '<svg class="icon-stroke icon-play" viewBox="0 0 24 24" aria-hidden="true">' +
              '<polygon points="8,6 18,12 8,18"></polygon>' +
              "</svg>" +
              '<svg class="icon-stroke icon-pause" viewBox="0 0 24 24" aria-hidden="true">' +
              '<line x1="9" y1="6" x2="9" y2="18"></line>' +
              '<line x1="15" y1="6" x2="15" y2="18"></line>' +
              "</svg>";
            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "audio-table-delete";
            deleteBtn.setAttribute("aria-label", t("upload_audio_delete"));
            deleteBtn.setAttribute("data-filename", name);
            deleteBtn.innerHTML =
              '<svg class="icon-stroke" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
            actionWrap.appendChild(playBtn);
            actionWrap.appendChild(deleteBtn);
            tdAction.appendChild(actionWrap);
            tr.appendChild(tdNo);
            tr.appendChild(tdTitle);
            tr.appendChild(tdAction);
            $audioList.append(tr);
          });
        }
        if (state.previewAudioFile) {
          const $row = $audioList.find(
            'tr[data-filename="' + CSS.escape(state.previewAudioFile) + '"]',
          );
          if ($row.length) {
            ensurePreviewAnchor($row);
          } else {
            closePreviewPanel();
          }
        }
        setPreviewPlaying(state.previewAudioPlaying);
        updatePreviewTrackControls();
        if (
          state.previewAudioAutoAdvance &&
          !state.previewAudioFile &&
          files.length
        ) {
          playPreviewAudio(files[0]);
        }
      })
      .fail(function () {
        $audioList.empty();
        $("#audio-table-wrap").addClass("is-hidden");
        $audioListEmpty.removeClass("is-hidden");
        stopPreviewAutoAdvance();
        $audioUploadPlayAll.prop("disabled", true);
      });
  }

  function openAudioUploadModal() {
    $audioUploadError.text("");
    $audioUploadInput.val("");
    loadAudioList();
    $audioUploadModal.removeClass("is-hidden").attr("aria-hidden", "false");
    window.setTimeout(function () {
      $audioUploadInput.trigger("focus");
    }, 0);
  }

  function closeAudioUploadModal() {
    $audioUploadModal.addClass("is-hidden").attr("aria-hidden", "true");
    $audioUploadError.text("");
    $audioUploadInput.val("");
    closePreviewPanel();
  }

  function toAbsoluteUrl(pathOrUrl) {
    const raw = String(pathOrUrl || "").trim();
    if (!raw) {
      return "";
    }
    try {
      return new URL(raw, window.location.origin).href;
    } catch (_err) {
      return raw;
    }
  }

  function renderInvitationLinkList(entries) {
    const list = Array.isArray(entries) ? entries : [];
    state.invitationLinks = list.slice();
    $invitationLinkList.empty();
    const hasEntries = list.length > 0;
    $invitationLinkTableWrap.toggleClass("is-hidden", !hasEntries);
    $invitationLinkListEmpty.toggleClass("is-hidden", hasEntries);
    if (!hasEntries) {
      return;
    }
    list.forEach(function (entry, index) {
      const code = String(entry && entry.code ? entry.code : "").trim();
      const guestbookVisible = !(
        entry &&
        Object.prototype.hasOwnProperty.call(entry, "guestbook_visible") &&
        !entry.guestbook_visible
      );
      const wishes = Array.isArray(entry && entry.guestbook) ? entry.guestbook : [];
      const tr = document.createElement("tr");
      const tdNo = document.createElement("td");
      tdNo.className = "audio-col-no";
      tdNo.textContent = index + 1;

      const tdRecipient = document.createElement("td");
      tdRecipient.className = "invitation-link-col-recipient";
      const recipient = document.createElement("span");
      recipient.className = "invitation-link-recipient";
      recipient.textContent = String(entry && entry.recipient ? entry.recipient : "");
      recipient.setAttribute("title", recipient.textContent);
      tdRecipient.appendChild(recipient);

      const tdMessage = document.createElement("td");
      tdMessage.className = "invitation-link-col-message";
      const messageWrap = document.createElement("div");
      messageWrap.className = "invitation-link-wishes is-visible";
      if (wishes.length) {
        wishes.forEach(function (wish) {
          const message = String(wish && wish.message ? wish.message : "");
          const item = document.createElement("button");
          item.className = "invitation-link-wish-item";
          item.type = "button";
          item.textContent = truncateTextPreview(message, 30);
          item.setAttribute("data-full-message", message);
          item.setAttribute("title", message);
          item.setAttribute("aria-label", "Xem toàn bộ lời chúc");
          messageWrap.appendChild(item);
        });
      } else {
        const empty = document.createElement("p");
        empty.className = "invitation-link-wish-empty";
        empty.textContent = "Chưa có lời chúc";
        messageWrap.appendChild(empty);
      }
      tdMessage.appendChild(messageWrap);

      const tdAction = document.createElement("td");
      tdAction.className = "audio-col-action";
      const actionWrap = document.createElement("div");
      actionWrap.className = "invitation-link-actions admin-request-actions";
      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "admin-request-action-button invitation-link-toggle";
      toggleBtn.setAttribute("data-code", code);
      toggleBtn.setAttribute(
        "aria-label",
        guestbookVisible ? "Ẩn lời chúc" : "Hiện lời chúc",
      );
      toggleBtn.setAttribute(
        "title",
        guestbookVisible ? "Ẩn lời chúc" : "Hiện lời chúc",
      );
      toggleBtn.innerHTML = guestbookVisible
        ? '<svg viewBox="0 0 640 512" aria-hidden="true"><path d="M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z"></path></svg>'
        : '<svg viewBox="0 0 576 512" aria-hidden="true"><path d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"></path></svg>';
      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "admin-request-action-button invitation-link-copy";
      copyBtn.setAttribute("aria-label", "Copy link mời");
      copyBtn.setAttribute("title", "Copy link mời");
      copyBtn.setAttribute(
        "data-link-path",
        String(entry && entry.link_path ? entry.link_path : ""),
      );
      copyBtn.innerHTML =
        '<svg viewBox="0 0 448 512" aria-hidden="true">' +
        '<path d="M320 448v40c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24V120c0-13.255 10.745-24 24-24h72v296c0 30.879 25.121 56 56 56h168zm0-344V0H152c-13.255 0-24 10.745-24 24v368c0 13.255 10.745 24 24 24h272c13.255 0 24-10.745 24-24V128H344c-13.2 0-24-10.8-24-24zm120.971-31.029L375.029 7.029A24 24 0 0 0 358.059 0H352v96h96v-6.059a24 24 0 0 0-7.029-16.97z"></path>' +
        "</svg>";
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "admin-request-action-button invitation-link-edit";
      editBtn.setAttribute("data-code", code);
      editBtn.setAttribute("aria-label", "Sửa thiệp mời");
      editBtn.setAttribute("title", "Sửa thiệp mời");
      editBtn.innerHTML =
        '<svg viewBox="0 0 576 512" aria-hidden="true">' +
        '<path d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z"></path>' +
        "</svg>";
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "admin-request-action-button invitation-link-delete";
      deleteBtn.setAttribute("data-code", code);
      deleteBtn.setAttribute("aria-label", "Xóa thiệp mời");
      deleteBtn.setAttribute("title", "Xóa thiệp mời");
      deleteBtn.innerHTML =
        '<svg viewBox="0 0 448 512" aria-hidden="true">' +
        '<path d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"></path>' +
        "</svg>";
      actionWrap.appendChild(toggleBtn);
      actionWrap.appendChild(copyBtn);
      actionWrap.appendChild(editBtn);
      actionWrap.appendChild(deleteBtn);
      tdAction.appendChild(actionWrap);

      tr.appendChild(tdNo);
      tr.appendChild(tdRecipient);
      tr.appendChild(tdMessage);
      tr.appendChild(tdAction);
      $invitationLinkList.append(tr);
    });
  }

  function loadInvitationLinkList() {
    if (!state.authUser) {
      return $.Deferred().resolve().promise();
    }
    state.invitationLinksLoading = true;
    $invitationLinkError.text("Đang tải danh sách thiệp...");
    return $.getJSON(buildApiUrl("__invitation_links__"))
      .done(function (response) {
        renderInvitationLinkList(
          response && Array.isArray(response.entries) ? response.entries : [],
        );
        $invitationLinkError.text("");
      })
      .fail(function (xhr) {
        renderInvitationLinkList([]);
        const payload = xhr && xhr.responseJSON;
        $invitationLinkError.text(
          (payload && payload.message) || "Không tải được danh sách thiệp.",
        );
      })
      .always(function () {
        state.invitationLinksLoading = false;
      });
  }

  function openInvitationLinkModal() {
    $invitationLinkError.text("");
    resetInvitationLinkForm();
    renderInvitationLinkList(state.invitationLinks);
    loadInvitationLinkList();
    $invitationLinkModal.removeClass("is-hidden").attr("aria-hidden", "false");
    updateInvitationLinkButtonUi();
    window.setTimeout(function () {
      $invitationLinkName.trigger("focus");
    }, 0);
  }

  function setInvitationLinkFormCollapsed(collapsed) {
    const isCollapsed = !!collapsed;
    $invitationLinkFormSection.toggleClass("is-collapsed", isCollapsed);
    $invitationLinkFormToggle
      .attr("aria-expanded", isCollapsed ? "false" : "true")
      .attr(
        "aria-label",
        isCollapsed ? "Mở rộng form thiệp mời" : "Thu gọn form thiệp mời",
      )
      .attr(
        "title",
        isCollapsed ? "Mở rộng form thiệp mời" : "Thu gọn form thiệp mời",
      );
  }

  function closeInvitationLinkModal() {
    $invitationLinkModal.addClass("is-hidden").attr("aria-hidden", "true");
    $invitationLinkError.text("");
    resetInvitationLinkForm();
    updateInvitationLinkButtonUi();
  }

  function resetInvitationLinkForm() {
    state.editingInvitationLinkCode = "";
    $invitationLinkFormTitle.text("Tạo thiệp mới");
    $invitationLinkSubmit.text("Tạo thiệp");
    $invitationLinkEditCancel.addClass("is-hidden");
    $invitationLinkPrefix.val("");
    $invitationLinkTitle.val("");
    $invitationLinkName.val("");
    $invitationLinkSuffix.val("");
    $invitationLinkMessage.val(defaultInvitationGreeting);
    setInvitationLinkFormCollapsed(false);
  }

  function fillInvitationLinkForm(entry) {
    if (!entry || typeof entry !== "object") {
      return;
    }
    state.editingInvitationLinkCode = String(entry.code || "").trim();
    $invitationLinkFormTitle.text("Chỉnh sửa thiệp");
    $invitationLinkSubmit.text("Lưu thiệp");
    $invitationLinkEditCancel.removeClass("is-hidden");
    $invitationLinkPrefix.val(String(entry.prefix || ""));
    $invitationLinkTitle.val(String(entry.title || ""));
    $invitationLinkName.val(String(entry.name || ""));
    $invitationLinkSuffix.val(String(entry.suffix || ""));
    $invitationLinkMessage.val(
      String(entry.message || "").trim() || defaultInvitationGreeting,
    );
    $invitationLinkError.text("");
    setInvitationLinkFormCollapsed(false);
    window.setTimeout(function () {
      $invitationLinkName.trigger("focus");
    }, 0);
  }

  function submitInvitationLinkCreate() {
    if (state.creatingInvitationLink) {
      return;
    }
    if (!state.authUser) {
      showResultModal("Bạn cần đăng nhập admin để tạo thiệp.", "warning");
      return;
    }
    const prefix = String($invitationLinkPrefix.val() || "").trim();
    const title = String($invitationLinkTitle.val() || "").trim();
    const name = String($invitationLinkName.val() || "").trim();
    const suffix = String($invitationLinkSuffix.val() || "").trim();
    const message = String($invitationLinkMessage.val() || "").trim();
    if (!name) {
      $invitationLinkError.text("Vui lòng nhập tên người nhận.");
      return;
    }
    const isEditing = !!state.editingInvitationLinkCode;
    state.creatingInvitationLink = true;
    $invitationLinkError.text(isEditing ? "Đang cập nhật thiệp..." : "Đang tạo thiệp...");
    $invitationLinkSubmit.prop("disabled", true);
    $invitationLinkCancel.prop("disabled", true);
    $.ajax({
      url: buildApiUrl("__invitation_links__"),
      method: "POST",
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify({
        code: state.editingInvitationLinkCode,
        edit: isEditing,
        prefix: prefix,
        title: title,
        name: name,
        suffix: suffix,
        message: message,
      }),
    })
      .done(function (response) {
        if (!response || !response.ok) {
          $invitationLinkError.text(
            (response && response.message) || "Không tạo được thiệp mời.",
          );
          return;
        }
        renderInvitationLinkList(
          Array.isArray(response.entries) ? response.entries : [],
        );
        $invitationLinkError.text("");
        showResultModal(
          isEditing
            ? "Cập nhật thiệp thành công."
            : response.duplicate
              ? "Thiệp này đã tồn tại, mình đã giữ lại link cũ."
              : "Tạo thiệp thành công.",
          "success",
        );
        resetInvitationLinkForm();
      })
      .fail(function (xhr) {
        const payload = xhr && xhr.responseJSON;
        $invitationLinkError.text(
          (payload && payload.message) ||
            (isEditing
              ? "Không cập nhật được thiệp mời."
              : "Không tạo được thiệp mời."),
        );
      })
      .always(function () {
        state.creatingInvitationLink = false;
        $invitationLinkSubmit.prop("disabled", false);
        $invitationLinkCancel.prop("disabled", false);
      });
  }

  function closeConfirmModal(confirmed) {
    if (state.confirmOptions && state.confirmOptions.showRenewDays) {
      const rawValue = String($confirmModalDays.val() || "");
      const parsedDays = Number.parseInt(rawValue, 10);
      state.confirmOptions.selectedRenewDays =
        Number.isFinite(parsedDays) && parsedDays > 0
          ? parsedDays
          : state.confirmOptions.defaultRenewDays || 7;
    }
    $confirmModal.addClass("is-hidden").attr("aria-hidden", "true");
    const resolver = state.confirmResolver;
    state.confirmResolver = null;
    if (typeof resolver === "function") {
      resolver(Boolean(confirmed));
    }
  }

  function showResultModal(message, type, options) {
    const raw = String(type || "success").toLowerCase();
    const kind = ["success", "error", "warning", "info"].includes(raw)
      ? raw
      : "success";
    const opts = options && typeof options === "object" ? options : {};
    const autoCloseMs =
      typeof opts.autoCloseMs === "number" && opts.autoCloseMs >= 0
        ? opts.autoCloseMs
        : 4200;
    const $target =
      opts.target && opts.target.length ? opts.target : $alertStack;
    const titleKey =
      kind === "error"
        ? "notice_error"
        : kind === "warning"
          ? "notice_warning"
          : kind === "info"
            ? "notice_info"
            : "notice_success";

    const iconSvg =
      kind === "error"
        ? '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><line x1="8" y1="8" x2="16" y2="16"></line><line x1="16" y1="8" x2="8" y2="16"></line></svg>'
        : kind === "warning"
          ? '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 3.9L1.8 18.2A1.4 1.4 0 0 0 3 20.3h18a1.4 1.4 0 0 0 1.2-2.1L13.7 3.9a1.9 1.9 0 0 0-3.4 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><circle cx="12" cy="17" r="1"></circle></svg>'
          : kind === "info"
            ? '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><line x1="12" y1="10" x2="12" y2="16"></line><circle cx="12" cy="7.5" r="1"></circle></svg>'
            : '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><polyline points="8,12 11,15 16,9"></polyline></svg>';

    const $alert = $(
      '<div class="app-alert is-' +
        kind +
        '">' +
        '<span class="app-alert-icon">' +
        iconSvg +
        "</span>" +
        '<div class="app-alert-content">' +
        '<p class="app-alert-title"></p>' +
        '<p class="app-alert-message"></p>' +
        "</div>" +
        '<button type="button" class="app-alert-close" aria-label="Close" title="Close">' +
        '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>' +
        "</button>" +
        "</div>",
    );
    $alert.find(".app-alert-title").text(t(titleKey));
    $alert.find(".app-alert-message").text(String(message || ""));
    $alert.find(".app-alert-close").on("click", function () {
      $alert.removeClass("is-show");
      window.setTimeout(function () {
        $alert.remove();
      }, 180);
    });
    $target.append($alert);
    window.requestAnimationFrame(function () {
      $alert.addClass("is-show");
    });
    if (autoCloseMs > 0) {
      window.setTimeout(function () {
        if (!$alert.closest("body").length) {
          return;
        }
        $alert.removeClass("is-show");
        window.setTimeout(function () {
          $alert.remove();
        }, 180);
      }, autoCloseMs);
    }
  }

  function openConfirmModal(message, options) {
    const opts = options && typeof options === "object" ? options : {};
    state.confirmOptions = opts;
    $confirmModalTitle.text(t("confirm_title"));
    $confirmModalMessage.text(String(message || ""));
    $confirmNo.text(t("confirm_no"));
    $confirmYes.text(t("confirm_yes"));
    if (opts.showRenewDays) {
      $confirmModalRenewDays.removeClass("is-hidden");
      $confirmModalDays.val(
        Number.isFinite(opts.defaultRenewDays) && opts.defaultRenewDays > 0
          ? String(opts.defaultRenewDays)
          : "7",
      );
    } else {
      $confirmModalRenewDays.addClass("is-hidden");
    }
    $confirmModal.removeClass("is-hidden").attr("aria-hidden", "false");
    return new Promise(function (resolve) {
      state.confirmResolver = resolve;
      window.setTimeout(function () {
        $confirmYes.trigger("focus");
      }, 0);
    });
  }

  function syncUploadTypeUi() {
    $uploadTypeOptions.find(".upload-type-btn").removeClass("is-active");
    $uploadTypeOptions
      .find("[data-upload-type='" + state.uploadType + "']")
      .addClass("is-active");
    $uploadFilesInput.addClass("is-hidden");
    $uploadFolderInput.addClass("is-hidden");
    $uploadZipInput.addClass("is-hidden");
    if (state.uploadType === "folder") {
      $uploadFilesLabel.text(t("upload_folder_label"));
      $uploadHelpText.text(t("upload_help_folder"));
      $uploadFolderInput.removeClass("is-hidden");
      return;
    }
    if (state.uploadType === "zip") {
      $uploadFilesLabel.text(t("upload_zip_label"));
      $uploadHelpText.text(t("upload_help_zip"));
      $uploadZipInput.removeClass("is-hidden");
      return;
    }
    $uploadFilesLabel.text(t("upload_files_label"));
    $uploadHelpText.text(t("upload_help_files"));
    $uploadFilesInput.removeClass("is-hidden");
  }

  function openUploadModal() {
    $uploadAlbumName.val("");
    state.uploadType = "files";
    syncUploadTypeUi();
    $uploadError.text("");
    $uploadModal.removeClass("is-hidden").attr("aria-hidden", "false");
    window.setTimeout(function () {
      $uploadAlbumName.trigger("focus");
    }, 0);
  }

  function getSelectedUploadFiles() {
    if (state.uploadType === "folder") {
      return $uploadFolderInput.get(0).files || [];
    }
    if (state.uploadType === "zip") {
      return $uploadZipInput.get(0).files || [];
    }
    return $uploadFilesInput.get(0).files || [];
  }

  function sanitizeSuggestedAlbumName(rawName) {
    const name = String(rawName || "")
      .replace(/\.[^.]+$/, "")
      .replace(/[\\/]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return name;
  }

  function getAlbumSuggestionFromFiles(files, uploadType) {
    const list = files && typeof files.length === "number" ? files : [];
    if (!list.length) {
      return "";
    }
    const first = list[0];
    if (!first) {
      return "";
    }

    if (uploadType === "folder") {
      const relPath = String(first.webkitRelativePath || "").trim();
      if (relPath) {
        const folder = relPath.split("/")[0] || "";
        return sanitizeSuggestedAlbumName(folder);
      }
    }

    return sanitizeSuggestedAlbumName(first.name || "");
  }

  function autofillAlbumNameIfEmpty(uploadType, files) {
    const current = String($uploadAlbumName.val() || "").trim();
    if (current) {
      return;
    }
    const suggestion = getAlbumSuggestionFromFiles(files, uploadType);
    if (suggestion) {
      $uploadAlbumName.val(suggestion);
      $uploadAlbumName.removeClass("has-error");
      $uploadAlbumError.addClass("is-hidden").text("");
    }
  }

  function pollBuildAndReload(preferredFolder) {
    let retries = 0;
    const maxRetries = 120;
    const tick = function () {
      $.getJSON(buildApiUrl("__build_status__"))
        .done(function (status) {
          if (!status || !status.running) {
            const buildCode = Number(status && status.code);
            if (!Number.isNaN(buildCode) && buildCode > 0) {
              showResultModal(
                t("upload_build_failed", { code: buildCode }),
                "error",
              );
            }
            loadAlbums(preferredFolder).catch(function () {
              renderError();
            });
            return;
          }
          retries += 1;
          if (retries >= maxRetries) {
            loadAlbums(preferredFolder).catch(function () {
              renderError();
            });
            return;
          }
          window.setTimeout(tick, 1500);
        })
        .fail(function () {
          loadAlbums(preferredFolder).catch(function () {
            renderError();
          });
        });
    };
    tick();
  }

  function applySidebarState() {
    if (mobileMedia.matches) {
      $(".album-app").removeClass("is-sidebar-collapsed");
      return;
    }
    const collapsed = !!state.sidebarCollapsed;
    $(".album-app").toggleClass("is-sidebar-collapsed", collapsed);
    const label = collapsed ? t("sidebar_expand") : t("sidebar_collapse");
    $sidebarToggle.attr("aria-label", label);
    $sidebarToggle.attr("title", label);
    $sidebarToggle.toggleClass("is-collapsed", collapsed);
  }

  function applyMobileSidebarState() {
    const isOpen = mobileMedia.matches && !!state.mobileSidebarOpen;
    $(".album-app").toggleClass("is-mobile-sidebar-open", isOpen);
    const label = isOpen ? "Close menu" : "Open menu";
    $mobileMenuToggle.attr("aria-label", label);
    $mobileMenuToggle.attr("title", label);
    $mobileMenuToggle.toggleClass("is-open", isOpen);
  }

  function renderRadiusControl() {
    $radiusRange.val(state.radius.toFixed(2));
    $radiusValue.text(t("radius_value", { value: state.radius.toFixed(2) }));
  }

  function renderInitialState() {
    stopSlideshow();
    $albumTitle.text(t("initial_title"));
    $albumDescription.text(t("initial_description"));
    $imageGrid.empty();
    updateSlideshowButtonState();
    if (state.pageMode === "admin") {
      if (state.adminPanel !== "requests") {
        state.adminPanel = "requests";
      }
      renderAdminRequestsPanel();
    }
  }

  function renderError() {
    stopSlideshow();
    state.hasError = true;
    $albumTitle.text(t("error_title"));
    $albumDescription.text(t("error_desc"));
    $imageGrid.html('<p class="empty">' + t("error_empty") + "</p>");
    $gridLoadingOverlay.addClass("is-hidden");
    $imageGridWrap.removeClass("is-loading");
    updateSlideshowButtonState();
  }

  function showGridLoading(renderToken) {
    state.gridLoadingToken = renderToken;
    $imageGridWrap.addClass("is-loading");
    $gridLoadingOverlay.removeClass("is-hidden");
  }

  function hideGridLoading(renderToken) {
    if (renderToken !== state.gridLoadingToken) {
      return;
    }
    $gridLoadingOverlay.addClass("is-hidden");
    $imageGridWrap.removeClass("is-loading");
  }

  function ensureImageObserver() {
    if (state.imageObserver || !("IntersectionObserver" in window)) {
      return;
    }

    state.imageObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          hydrateImageSrc(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: imageObserverMargin, threshold: 0.01 },
    );
  }

  function normalizeImageEntry(entry) {
    if (entry && typeof entry === "object") {
      return {
        name: entry.name || "",
        root:
          entry.root === "thumbs"
            ? "thumbs"
            : entry.root === "row"
              ? "row"
              : "albums",
        detail: entry.detail || entry.name || "",
        detailRoot:
          entry.detail_root === "thumbs"
            ? "thumbs"
            : entry.detail_root === "row"
              ? "row"
              : "albums",
        original: entry.original || entry.name || "",
        originalRoot: entry.original_root === "row" ? "row" : "albums",
        uploadedAt: normalizeTimestamp(entry.uploaded_at || entry.uploadedAt),
        createdAt: normalizeTimestamp(entry.created_at || entry.createdAt),
        nameTime: extractTimestampFromName(entry.original || entry.name || ""),
      };
    }
    return {
      name: String(entry || ""),
      root: "albums",
      detail: String(entry || ""),
      detailRoot: "albums",
      original: String(entry || ""),
      originalRoot: "albums",
      uploadedAt: 0,
      createdAt: 0,
      nameTime: extractTimestampFromName(entry),
    };
  }

  function hydrateImageSrc(imageEl) {
    const src = imageEl.getAttribute("data-src");
    if (!src) {
      return;
    }

    imageEl.src = src;
    imageEl.removeAttribute("data-src");
    imageEl.classList.add("is-loaded");
  }

  function queueImageLoad($img, $card, src, altText, immediate, fallbackSrcs) {
    const imageEl = $img.get(0);
    const cardEl = $card.get(0);
    const primarySrc = String(src || "").trim();
    const candidates = [primarySrc]
      .concat(Array.isArray(fallbackSrcs) ? fallbackSrcs : [fallbackSrcs])
      .map(function (value) {
        return String(value || "").trim();
      })
      .filter(function (value, index, arr) {
        return !!value && arr.indexOf(value) === index;
      });
    let currentIndex = 0;
    let retriedCurrent = false;
    function withRetryToken(url) {
      const sep = url.includes("?") ? "&" : "?";
      return url + sep + "r=" + Date.now();
    }
    const onLoad = function () {
      imageEl.classList.add("is-loaded");
      if (cardEl) {
        cardEl.classList.remove("is-loading");
      }
      imageEl.removeEventListener("load", onLoad);
      imageEl.removeEventListener("error", onError);
    };
    const onError = function () {
      const current = candidates[currentIndex] || "";
      if (!retriedCurrent && current) {
        retriedCurrent = true;
        imageEl.src = withRetryToken(current);
        return;
      }
      currentIndex += 1;
      retriedCurrent = false;
      if (currentIndex < candidates.length) {
        imageEl.src = candidates[currentIndex];
        return;
      }
      if (cardEl) {
        cardEl.classList.remove("is-loading");
      }
      imageEl.removeEventListener("load", onLoad);
      imageEl.removeEventListener("error", onError);
    };

    if (cardEl) {
      cardEl.classList.add("is-loading");
    }

    imageEl.classList.remove("is-loaded");
    imageEl.addEventListener("load", onLoad);
    imageEl.addEventListener("error", onError);
    imageEl.setAttribute("alt", altText);
    imageEl.setAttribute("loading", "lazy");
    imageEl.setAttribute("decoding", "async");
    imageEl.setAttribute("fetchpriority", "low");
    imageEl.setAttribute("data-src", candidates[0] || "");

    if (immediate) {
      hydrateImageSrc(imageEl);
      if (imageEl.complete && imageEl.naturalWidth > 0) {
        onLoad();
      }
      return;
    }

    if (state.imageObserver) {
      state.imageObserver.observe(imageEl);
      return;
    }

    hydrateImageSrc(imageEl);
  }

  function resolveImageInfo(folderName, imageEntry) {
    const normalized = normalizeImageEntry(imageEntry);
    const fileName = normalized.name;
    const baseRoot = sourceRoots[normalized.root] || sourceRoots.albums;
    const imagePath =
      baseRoot +
      encodeURIComponent(folderName) +
      "/" +
      encodeURIComponent(fileName);
    const detailName = normalized.detail || fileName;
    const detailBase = sourceRoots[normalized.detailRoot] || sourceRoots.albums;
    const detailPath =
      detailBase +
      encodeURIComponent(folderName) +
      "/" +
      encodeURIComponent(detailName);
    const originalName = normalized.original || fileName;
    const originalBase =
      sourceRoots[normalized.originalRoot] || sourceRoots.albums;
    const originalPath =
      originalBase +
      encodeURIComponent(folderName) +
      "/" +
      encodeURIComponent(originalName);
    return {
      fileName: fileName,
      imagePath: imagePath,
      detailPath: detailPath,
      detailName: detailName,
      originalPath: originalPath,
      originalName: originalName,
    };
  }

  function createImageCard(folderName, imageEntry, altText, immediateLoad) {
    const info = resolveImageInfo(folderName, imageEntry);
    const baseName = toCaptionBaseName(info.originalName || info.fileName);
    const isHidden = isImageHidden(
      folderName,
      info.originalName || info.fileName || "",
    );
    const fallbackPaths = [];
    if (info.detailPath && info.detailPath !== info.imagePath) {
      fallbackPaths.push(info.detailPath);
    }
    if (info.originalPath && info.originalPath !== info.imagePath) {
      fallbackPaths.push(info.originalPath);
    }
    const cardEl = $template.get(0).content.firstElementChild.cloneNode(true);
    const $card = $(cardEl);
    const $img = $card.find("img");
    queueImageLoad(
      $img,
      $card,
      info.imagePath,
      altText,
      !!immediateLoad,
      fallbackPaths,
    );
    $img.attr("data-view-src", info.detailPath);
    $img.attr("data-view-name", info.detailName);
    $img.attr("data-original-src", info.originalPath);
    $img.attr("data-original-name", info.originalName);
    $card.attr("data-folder", String(folderName || ""));
    $card.attr("data-original-name", info.originalName || info.fileName || "");
    $card.toggleClass("is-hidden-image", isHidden);
    const $caption = $card.find(".caption");
    if (state.editingPage) {
      $card.addClass("is-editing");
      const $nameInput = $("<input />")
        .attr("type", "text")
        .addClass("image-name-edit")
        .attr("data-folder", String(folderName || ""))
        .attr("data-original-name", info.originalName || info.fileName || "")
        .attr("data-original-stem", baseName)
        .val(baseName);
      $caption.empty().append($nameInput);
    } else {
      $caption.text(baseName);
    }
    $card
      .find(".thumb-download")
      .attr("href", info.originalPath)
      .attr("download", info.originalName || info.fileName || "image");
    const isAdmin = String(state.authRole || "").toLowerCase() === "admin";
    const $deleteBtn = $card.find(".thumb-delete");
    const $hideBtn = $card.find(".thumb-hide");
    if (isAdmin) {
      $deleteBtn
        .removeClass("is-hidden")
        .attr("aria-label", t("image_delete"))
        .attr("title", t("image_delete"))
        .attr("data-folder", String(folderName || ""))
        .attr("data-file", info.originalName || info.fileName || "");
      if (state.editingPage) {
        const hideLabel = isHidden
          ? t("image_show_label")
          : t("image_hide_label");
        const iconSvg = isHidden
          ? '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"></path><circle cx="12" cy="12" r="2.6"></circle></svg>'
          : '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"></path><line x1="4" y1="4" x2="20" y2="20"></line></svg>';
        $hideBtn
          .removeClass("is-hidden")
          .attr("aria-label", hideLabel)
          .attr("title", hideLabel)
          .html(iconSvg)
          .off("click")
          .on("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            const nextHidden = !isImageHidden(
              folderName,
              info.originalName || info.fileName || "",
            );
            setImageHidden(
              folderName,
              info.originalName || info.fileName || "",
              nextHidden,
            );
            const nextLabel = nextHidden
              ? t("image_show_label")
              : t("image_hide_label");
            const nextIcon = nextHidden
              ? '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"></path><circle cx="12" cy="12" r="2.6"></circle></svg>'
              : '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"></path><line x1="4" y1="4" x2="20" y2="20"></line></svg>';
            $card.toggleClass("is-hidden-image", nextHidden);
            $hideBtn
              .attr("aria-label", nextLabel)
              .attr("title", nextLabel)
              .html(nextIcon);
          });
      } else {
        $hideBtn.addClass("is-hidden");
      }
    } else {
      $deleteBtn.remove();
      $hideBtn.remove();
    }
    return cardEl;
  }

  function getItemsPerBatch(targetEl) {
    const width =
      targetEl.getBoundingClientRect().width || targetEl.clientWidth || 0;
    const columns = Math.max(
      1,
      Math.floor((width + imageGridGap) / (imageCardMinWidth + imageGridGap)),
    );
    return columns * imageRowsPerBatch;
  }

  function clearProgressiveRenderers() {
    state.progressiveRenderers = [];
  }

  function createBatchSpinner() {
    return $(
      '<div class="batch-spinner" aria-hidden="true">' +
        '<span class="batch-spinner-dot"></span>' +
        "</div>",
    ).get(0);
  }

  function appendNextBatch(renderer) {
    if (!renderer || renderer.renderToken !== state.renderToken) {
      return;
    }
    if (renderer.loading) {
      return;
    }
    if (renderer.cursor >= renderer.items.length) {
      renderer.done = true;
      return;
    }

    renderer.loading = true;
    const spinner = createBatchSpinner();
    renderer.targetEl.appendChild(spinner);

    window.requestAnimationFrame(function () {
      if (renderer.renderToken !== state.renderToken) {
        if (spinner.isConnected) {
          spinner.remove();
        }
        renderer.loading = false;
        return;
      }

      const perBatch = getItemsPerBatch(renderer.targetEl);
      const end = Math.min(renderer.cursor + perBatch, renderer.items.length);
      const batchItems = renderer.items.slice(renderer.cursor, end);

      if (renderer.renderToken !== state.renderToken) {
        if (spinner.isConnected) {
          spinner.remove();
        }
        renderer.loading = false;
        return;
      }

      const fragment = document.createDocumentFragment();
      const pendingLoads = [];
      batchItems.forEach(function (item) {
        const cardEl = renderer.builder(item);
        fragment.appendChild(cardEl);
        renderer.cursor += 1;
        if (!renderer.hasRenderedFirstBatch) {
          const imgEl = cardEl.querySelector("img");
          if (imgEl && !imgEl.complete) {
            pendingLoads.push(
              new Promise(function (resolve) {
                const done = function () {
                  imgEl.removeEventListener("load", done);
                  imgEl.removeEventListener("error", done);
                  resolve();
                };
                imgEl.addEventListener("load", done, { once: true });
                imgEl.addEventListener("error", done, { once: true });
              }),
            );
          }
        }
      });

      renderer.targetEl.insertBefore(fragment, spinner);
      spinner.remove();

      const completeBatch = function () {
        if (!renderer.hasRenderedFirstBatch) {
          renderer.hasRenderedFirstBatch = true;
          if (renderer.onFirstBatchDone) {
            renderer.onFirstBatchDone();
          }
        }
        if (renderer.cursor >= renderer.items.length) {
          renderer.done = true;
        }
        renderer.loading = false;
        maybeLoadMoreByScroll();
      };

      if (!renderer.hasRenderedFirstBatch && pendingLoads.length) {
        Promise.allSettled(pendingLoads).then(function () {
          if (renderer.renderToken !== state.renderToken) {
            renderer.loading = false;
            return;
          }
          completeBatch();
        });
      } else {
        completeBatch();
      }
    });
  }

  function maybeLoadMoreByScroll() {
    const viewportBottom =
      window.innerHeight || document.documentElement.clientHeight || 0;
    state.progressiveRenderers.forEach(function (renderer) {
      if (
        !renderer ||
        renderer.done ||
        renderer.renderToken !== state.renderToken
      ) {
        return;
      }
      const rect = renderer.targetEl.getBoundingClientRect();
      if (rect.bottom <= viewportBottom + loadMoreThreshold) {
        appendNextBatch(renderer);
      }
    });
  }

  function registerProgressiveRenderer(
    targetEl,
    items,
    builder,
    onFirstBatchDone,
    renderToken,
  ) {
    const renderer = {
      targetEl: targetEl,
      items: items,
      builder: builder,
      onFirstBatchDone:
        typeof onFirstBatchDone === "function" ? onFirstBatchDone : null,
      hasRenderedFirstBatch: false,
      cursor: 0,
      done: false,
      loading: false,
      renderToken: renderToken,
    };
    state.progressiveRenderers.push(renderer);
    appendNextBatch(renderer);
    maybeLoadMoreByScroll();
  }

  function renderActiveAlbum() {
    stopSlideshow();
    if (!state.albums.length) {
      $albumTitle.text(t("no_album_title"));
      $albumDescription.text(t("no_album_desc"));
      $imageGrid.html('<p class="empty">' + t("no_album_empty") + "</p>");
      $gridLoadingOverlay.addClass("is-hidden");
      $imageGridWrap.removeClass("is-loading");
      updateSlideshowButtonState();
      return;
    }

    const visibleEntries = getVisibleAlbumEntries();
    if (!state.editingPage && !visibleEntries.length) {
      $albumTitle.text(t("no_album_title"));
      $albumDescription.text(t("no_album_desc"));
      $imageGrid.html('<p class="empty">' + t("no_album_empty") + "</p>");
      $gridLoadingOverlay.addClass("is-hidden");
      $imageGridWrap.removeClass("is-loading");
      updateSlideshowButtonState();
      return;
    }

    ensureActiveAlbumVisible(visibleEntries);
    const album = state.albums[state.activeIndex] || state.albums[0];
    const searchTerm = String(state.searchQuery || "").trim();
    let images = Array.isArray(album.images) ? album.images : [];
    let albumTitle = album.isAll
      ? t("view_all")
      : album.title || t("album_unnamed");
    const hiddenFolders = getHiddenFolderSet();
    if (searchTerm) {
      const needle = normalizeSearchToken(searchTerm);
      images = [];
      const searchAlbums = state.editingPage
        ? state.albums.slice(1)
        : state.albums.filter(function (item) {
            return item && !item.isAll && !item.hidden;
          });
      searchAlbums.forEach(function (item) {
        const folder = item.folder || "";
        (Array.isArray(item.images) ? item.images : []).forEach(
          function (imageEntry) {
            const normalized = normalizeImageEntry(imageEntry);
            const haystack = normalizeSearchToken(
              folder + "/" + (normalized.original || normalized.name || ""),
            );
            if (haystack.indexOf(needle) !== -1) {
              images.push({
                folder: folder,
                name: normalized.name,
                root: normalized.root,
                detail: normalized.detail,
                detail_root: normalized.detailRoot,
                original: normalized.original,
                original_root: normalized.originalRoot,
                uploaded_at: normalized.uploadedAt,
                created_at: normalized.createdAt,
              });
            }
          },
        );
      });
      albumTitle = t("search_title");
    } else if (!state.editingPage && album.isAll && hiddenFolders.size) {
      images = images.filter(function (entry) {
        return !hiddenFolders.has(
          String(entry && entry.folder ? entry.folder : ""),
        );
      });
    }
    if (!state.editingPage) {
      const fallbackFolder = album.isAll ? "" : String(album.folder || "");
      images = images.filter(function (entry) {
        const folder = String(
          entry && entry.folder ? entry.folder : fallbackFolder,
        );
        return !isImageHidden(
          folder,
          entry && (entry.original || entry.name || ""),
        );
      });
    }
    images = sortImageEntries(images);
    const currentRenderToken = ++state.renderToken;
    showGridLoading(currentRenderToken);
    clearProgressiveRenderers();
    if (state.imageObserver) {
      state.imageObserver.disconnect();
    }

    if (state.editingPage && !searchTerm && !album.isAll) {
      const $titleInput = $("<input />")
        .attr("type", "text")
        .addClass("album-title-main-edit")
        .attr("data-folder", String(album.folder || ""))
        .attr("data-original-title", String(albumTitle || ""))
        .val(String(albumTitle || ""));
      $albumTitle.empty().append($titleInput);
    } else {
      $albumTitle.text(albumTitle);
    }
    $albumDescription.text(t("album_count", { count: images.length }));
    $imageGrid.empty();
    updateSlideshowButtonState();

    if (!images.length) {
      $imageGrid.html(
        '<p class="empty">' +
          (searchTerm ? t("search_empty") : t("album_empty")) +
          "</p>",
      );
      hideGridLoading(currentRenderToken);
      return;
    }

    if (searchTerm || album.isAll) {
      renderAllImagesByFolder(
        images,
        albumTitle,
        currentRenderToken,
        !!searchTerm,
      );
      return;
    }

    registerProgressiveRenderer(
      $imageGrid.get(0),
      images,
      function (imageEntry) {
        const normalized = normalizeImageEntry(imageEntry);
        return createImageCard(
          album.folder,
          normalized,
          albumTitle + " - " + normalized.name,
          false,
        );
      },
      function () {
        hideGridLoading(currentRenderToken);
      },
      currentRenderToken,
    );
  }

  function renderAllImagesByFolder(
    images,
    albumTitle,
    renderToken,
    forceExpand,
  ) {
    $imageGrid.empty();
    let hasAnyExpandedGroup = false;

    const byFolder = {};
    images.forEach(function (entry) {
      if (!entry || typeof entry !== "object") {
        return;
      }
      const folder = entry.folder || "others";
      if (!byFolder[folder]) {
        byFolder[folder] = [];
      }
      byFolder[folder].push(entry);
    });
    Object.keys(byFolder).forEach(function (folder) {
      byFolder[folder] = sortImageEntries(byFolder[folder]);
    });

    const folders = Object.keys(byFolder).sort(function (a, b) {
      return a.localeCompare(b);
    });
    if (!folders.length) {
      hideGridLoading(renderToken);
      return;
    }

    folders.forEach(function (folder) {
      const displayFolder = getDisplayFolderName(folder);
      const isCollapsed = forceExpand
        ? false
        : !!state.collapsedFolders[folder];
      const $group = $("<section class='folder-group'></section>").toggleClass(
        "is-collapsed",
        isCollapsed,
      );
      const $toggle = $(
        "<button class='folder-toggle' type='button'>" +
          "<span class='folder-title'></span>" +
          "<span class='folder-rule' aria-hidden='true'></span>" +
          "<span class='folder-chevron'>" +
          "<svg class='icon-stroke' viewBox='0 0 24 24' aria-hidden='true'>" +
          "<polyline points='6,10 12,16 18,10'></polyline>" +
          "</svg>" +
          "</span>" +
          "</button>",
      );
      $toggle.find(".folder-title").text(displayFolder);
      $toggle.attr("aria-label", displayFolder);
      $toggle.attr("aria-expanded", isCollapsed ? "false" : "true");

      $toggle.on("click", function () {
        const next = !state.collapsedFolders[folder];
        state.collapsedFolders[folder] = next;
        localStorage.setItem(
          "album-viewer-collapsed-folders",
          JSON.stringify(state.collapsedFolders),
        );
        $group.toggleClass("is-collapsed", next);
        $toggle.attr("aria-expanded", next ? "false" : "true");
        if (!next && !$groupGrid.attr("data-loaded")) {
          $groupGrid.attr("data-loaded", "1");
          registerProgressiveRenderer(
            $groupGrid.get(0),
            byFolder[folder],
            function (imageEntry) {
              const normalized = normalizeImageEntry(imageEntry);
              return createImageCard(
                folder,
                normalized,
                albumTitle + " - " + folder + "/" + normalized.name,
                false,
              );
            },
            function () {
              hideGridLoading(renderToken);
            },
            renderToken,
          );
        }
      });

      const $groupGrid = $("<div class='folder-grid'></div>");
      if (!isCollapsed) {
        hasAnyExpandedGroup = true;
        $groupGrid.attr("data-loaded", "1");
        registerProgressiveRenderer(
          $groupGrid.get(0),
          byFolder[folder],
          function (imageEntry) {
            const normalized = normalizeImageEntry(imageEntry);
            return createImageCard(
              folder,
              normalized,
              albumTitle + " - " + folder + "/" + normalized.name,
              false,
            );
          },
          function () {
            hideGridLoading(renderToken);
          },
          renderToken,
        );
      }

      $group.append($toggle, $groupGrid);
      $imageGrid.append($group);
    });

    // If user previously collapsed all groups, no renderer is registered.
    // In that case we must hide page loading immediately.
    if (!hasAnyExpandedGroup) {
      hideGridLoading(renderToken);
    }
  }

  function getDisplayFolderName(folder) {
    const raw = String(folder || "");
    const match = state.albums.find(function (item) {
      return String(item && item.folder ? item.folder : "") === raw;
    });
    const title = match && match.title ? String(match.title) : raw;
    return title.replace(/_/g, " ").trim();
  }

  function getHiddenFolderSet() {
    const hidden = new Set();
    state.albums.forEach(function (album) {
      if (!album || album.isAll) {
        return;
      }
      if (album.hidden) {
        hidden.add(String(album.folder || ""));
      }
    });
    return hidden;
  }

  function getVisibleAlbumEntries() {
    const entries = [];
    const allowHidden = state.editingPage;
    let visibleCount = 0;
    state.albums.forEach(function (album, index) {
      if (!album) {
        return;
      }
      if (album.isAll) {
        return;
      }
      if (!allowHidden && album.hidden) {
        return;
      }
      visibleCount += 1;
      entries.push({ album: album, index: index });
    });
    if (state.editingPage || visibleCount > 0) {
      const allAlbum = state.albums[0];
      if (allAlbum) {
        entries.unshift({ album: allAlbum, index: 0 });
      }
    }
    return entries;
  }

  function ensureActiveAlbumVisible(visibleEntries) {
    if (!visibleEntries.length) {
      state.activeIndex = 0;
      return;
    }
    const isVisible = visibleEntries.some(function (entry) {
      return entry.index === state.activeIndex;
    });
    if (!isVisible) {
      state.activeIndex = visibleEntries[0].index;
    }
  }

  function resetHiddenDrafts() {
    state.albums.forEach(function (album) {
      if (!album || album.isAll) {
        return;
      }
      if (typeof album.hiddenOriginal === "boolean") {
        album.hidden = album.hiddenOriginal;
      }
    });
  }

  function renderAlbumList() {
    $albumList.empty();

    const visibleEntries = getVisibleAlbumEntries();
    ensureActiveAlbumVisible(visibleEntries);

    visibleEntries.forEach(function (entry) {
      const album = entry.album;
      const index = entry.index;
      const overrideTitle =
        !album.isAll && state.albumTitleOverrides
          ? String(state.albumTitleOverrides[album.folder] || "")
          : "";
      const albumName = album.isAll
        ? t("view_all")
        : overrideTitle ||
          album.title ||
          t("album_default_name", { index: index + 1 });
      let photoCount = Array.isArray(album.images) ? album.images.length : 0;
      if (album.isAll && !state.editingPage) {
        const hiddenFolders = getHiddenFolderSet();
        photoCount = (Array.isArray(album.images) ? album.images : []).filter(
          function (entry) {
            const folder = String(entry && entry.folder ? entry.folder : "");
            if (hiddenFolders.size && hiddenFolders.has(folder)) {
              return false;
            }
            return !isImageHidden(
              folder,
              entry && (entry.original || entry.name || ""),
            );
          },
        ).length;
      } else if (!album.isAll && !state.editingPage) {
        const folder = String(album.folder || "");
        if (folder) {
          photoCount = (Array.isArray(album.images) ? album.images : []).filter(
            function (entry) {
              return !isImageHidden(
                folder,
                entry && (entry.original || entry.name || ""),
              );
            },
          ).length;
        }
      }
      const shortName = (albumName || "").trim().charAt(0).toUpperCase() || "•";
      const downloadAlbumKey = album.isAll ? "__all__" : album.folder || "";
      const downloadHref = buildApiUrl("__download__", {
        album: downloadAlbumKey,
      });
      const canAdminAction =
        !album.isAll && String(state.authRole || "").toLowerCase() === "admin";
      const itemActions = [];
      const $button = $(
        "<button type='button'><span class='item-icon'></span><span class='item-label'></span><span class='item-count'></span></button>",
      )
        .addClass("album-select")
        .attr("aria-label", albumName)
        .attr("title", albumName)
        .attr("data-short", shortName)
        .toggleClass("is-active", index === state.activeIndex)
        .on("click", function () {
          state.activeIndex = index;
          $albumList.find(".album-select").removeClass("is-active");
          $(this).addClass("is-active");
          renderActiveAlbum();
          if (mobileMedia.matches) {
            state.mobileSidebarOpen = false;
            applyMobileSidebarState();
          }
        });
      $button.find(".item-icon").text(shortName);
      if (state.editingPage && !album.isAll) {
        const $labelInput = $("<input />")
          .attr("type", "text")
          .addClass("album-title-edit-input")
          .attr("data-folder", String(album.folder || ""))
          .attr("data-original-title", String(albumName || ""))
          .val(String(albumName || ""));
        $labelInput.on("click mousedown keydown", function (event) {
          event.stopPropagation();
        });
        $button.find(".item-label").empty().append($labelInput);
      } else {
        $button.find(".item-label").text(albumName);
      }
      $button.find(".item-count").text(String(photoCount));

      const $item = $('<div class="album-item"></div>').append($button);
      $item.toggleClass("is-hidden-album", !!album.hidden);
      if (photoCount > 0) {
        const $download = $(
          '<a class="album-download" aria-label="Download album" title="Download album" href="' +
            downloadHref +
            '" download>' +
            '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true">' +
            '<line x1="12" y1="4" x2="12" y2="14"></line>' +
            '<polyline points="8,10 12,14 16,10"></polyline>' +
            '<path d="M5 18h14"></path>' +
            "</svg>" +
            "</a>",
        );
        $download.on("click", function (event) {
          event.stopPropagation();
        });
        itemActions.push($download);
      }
      if (canAdminAction) {
        if (state.editingPage) {
          const hiddenLabel = album.hidden
            ? t("album_show_label")
            : t("album_hide_label");
          const iconSvg = album.hidden
            ? '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"></path><circle cx="12" cy="12" r="2.6"></circle></svg>'
            : '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"></path><line x1="4" y1="4" x2="20" y2="20"></line></svg>';
          const $toggleHidden = $(
            '<button type="button" class="album-hide" aria-label="' +
              hiddenLabel +
              '" title="' +
              hiddenLabel +
              '">' +
              iconSvg +
              "</button>",
          );
          $toggleHidden.on("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            album.hidden = !album.hidden;
            renderAlbumList();
          });
          itemActions.push($toggleHidden);
        }
        const $retry = $(
          '<button type="button" class="album-retry" aria-label="' +
            t("retry_album_label") +
            '" title="' +
            t("retry_album_label") +
            '">' +
            '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M20 12a8 8 0 1 1-2.34-5.66"></path>' +
            '<polyline points="20,4 20,10 14,10"></polyline>' +
            "</svg>" +
            "</button>",
        );
        $retry.on("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          openConfirmModal(t("retry_album_confirm", { album: albumName })).then(
            function (confirmed) {
              if (!confirmed) {
                return;
              }
              $retry.prop("disabled", true);
              $.ajax({
                url: buildApiUrl("__rebuild_album__"),
                method: "POST",
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify({ album: album.folder || "" }),
              })
                .done(function (response) {
                  if (!response || !response.ok) {
                    showResultModal(
                      (response && response.message) || t("retry_album_fail"),
                      "error",
                    );
                    return;
                  }
                  showResultModal(
                    t("retry_album_success", { album: albumName }),
                    "success",
                  );
                  pollBuildAndReload(album.folder || "");
                })
                .fail(function (xhr) {
                  const payload = xhr && xhr.responseJSON;
                  showResultModal(
                    (payload && payload.message) || t("retry_album_fail"),
                    "error",
                  );
                })
                .always(function () {
                  $retry.prop("disabled", false);
                });
            },
          );
        });

        const $delete = $(
          '<button type="button" class="album-delete" aria-label="' +
            t("delete_album_label") +
            '" title="' +
            t("delete_album_label") +
            '">' +
            '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M4 7h16"></path>' +
            '<path d="M9 7V5h6v2"></path>' +
            '<rect x="7" y="7" width="10" height="12" rx="1"></rect>' +
            '<line x1="10" y1="11" x2="10" y2="17"></line>' +
            '<line x1="14" y1="11" x2="14" y2="17"></line>' +
            "</svg>" +
            "</button>",
        );
        $delete.on("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          openConfirmModal(
            t("delete_album_confirm", { album: albumName }),
          ).then(function (confirmed) {
            if (!confirmed) {
              return;
            }
            $delete.prop("disabled", true);
            $.ajax({
              url: buildApiUrl("__delete_album__"),
              method: "POST",
              contentType: "application/json",
              dataType: "json",
              data: JSON.stringify({ album: album.folder || "" }),
            })
              .done(function (response) {
                if (!response || !response.ok) {
                  showResultModal(
                    (response && response.message) || t("delete_album_fail"),
                    "error",
                  );
                  return;
                }
                showResultModal(
                  t("delete_album_success", { album: albumName }),
                  "success",
                );
                loadAlbums().catch(function () {
                  renderError();
                });
              })
              .fail(function (xhr) {
                const payload = xhr && xhr.responseJSON;
                showResultModal(
                  (payload && payload.message) || t("delete_album_fail"),
                  "error",
                );
              })
              .always(function () {
                $delete.prop("disabled", false);
              });
          });
        });
        itemActions.push($retry, $delete);
      }

      if (canAdminAction && itemActions.length <= 2) {
        $item.addClass("has-admin-actions");
      }
      if (itemActions.length > 2) {
        $item.addClass("has-overflow-actions");
        const $actionsToggle = $(
          '<button type="button" class="album-actions-toggle" aria-label="' +
            t("album_actions_label") +
            '" title="' +
            t("album_actions_label") +
            '">' +
            '<svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true">' +
            '<circle cx="12" cy="5" r="1.8"></circle>' +
            '<circle cx="12" cy="12" r="1.8"></circle>' +
            '<circle cx="12" cy="19" r="1.8"></circle>' +
            "</svg>" +
            "</button>",
        );
        const $actionsMenu = $(
          '<div class="album-actions-menu" aria-hidden="true"></div>',
        );
        itemActions.forEach(function ($action, actionIndex) {
          $action.addClass("album-action-item");
          $action.css(
            "--album-action-delay",
            String((itemActions.length - actionIndex - 1) * 38) + "ms",
          );
          $actionsMenu.append($action);
        });
        $actionsToggle.on("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          const willOpen = !$actionsMenu.hasClass("is-open");
          $(".album-actions-menu.is-open")
            .not($actionsMenu)
            .removeClass("is-open")
            .attr("aria-hidden", "true");
          $(".album-actions-toggle.is-open")
            .not($actionsToggle)
            .removeClass("is-open");
          $actionsMenu
            .toggleClass("is-open", willOpen)
            .attr("aria-hidden", willOpen ? "false" : "true");
          $actionsToggle.toggleClass("is-open", willOpen);
        });
        $actionsMenu.on("click", function (event) {
          event.stopPropagation();
        });
        $actionsMenu.find(".album-action-item").on("click", function () {
          $actionsMenu.removeClass("is-open").attr("aria-hidden", "true");
          $actionsToggle.removeClass("is-open");
        });
        $item.append($actionsMenu, $actionsToggle);
      } else if (itemActions.length) {
        const $actionsBar = $('<div class="album-actions-bar"></div>');
        itemActions.forEach(function ($action) {
          $actionsBar.append($action);
        });
        $item.append($actionsBar);
      }
      $albumList.append($("<li></li>").append($item));
    });

    renderActiveAlbum();
  }

  function collectEditPayload() {
    const albumTitlesByFolder = {};
    const imageRenameByKey = {};
    const hiddenAlbums = [];
    const hiddenImages = [];

    $(".album-title-edit-input").each(function () {
      const $input = $(this);
      const folder = String($input.attr("data-folder") || "").trim();
      const title = String($input.val() || "").trim();
      if (!folder || !title) {
        return;
      }
      albumTitlesByFolder[folder] = title;
    });

    $(".image-name-edit").each(function () {
      const $input = $(this);
      const folder = String($input.attr("data-folder") || "").trim();
      const oldName = String($input.attr("data-original-name") || "").trim();
      const newStem = String($input.val() || "").trim();
      if (!folder || !oldName || !newStem) {
        return;
      }
      const oldStem = toCaptionBaseName(oldName);
      if (oldStem === newStem) {
        return;
      }
      imageRenameByKey[folder + "||" + oldName] = {
        folder: folder,
        old_name: oldName,
        new_stem: newStem,
      };
    });

    state.albums.forEach(function (album) {
      if (!album || album.isAll) {
        return;
      }
      if (typeof album.hiddenOriginal !== "boolean") {
        return;
      }
      if (!!album.hidden === !!album.hiddenOriginal) {
        return;
      }
      const folder = String(album.folder || "").trim();
      if (!folder) {
        return;
      }
      hiddenAlbums.push({
        folder: folder,
        hidden: !!album.hidden,
      });
    });

    buildHiddenImageChanges().forEach(function (change) {
      hiddenImages.push(change);
    });

    return {
      album_titles: Object.keys(albumTitlesByFolder).map(function (folder) {
        return { folder: folder, title: albumTitlesByFolder[folder] };
      }),
      image_names: Object.keys(imageRenameByKey).map(function (key) {
        return imageRenameByKey[key];
      }),
      hidden_albums: hiddenAlbums,
      hidden_images: hiddenImages,
    };
  }

  function hasPendingEdits() {
    let changed = false;
    $(".album-title-edit-input, .album-title-main-edit").each(function () {
      if (changed) {
        return;
      }
      const $input = $(this);
      const original = String($input.attr("data-original-title") || "").trim();
      const current = String($input.val() || "").trim();
      if (original !== current) {
        changed = true;
      }
    });
    if (changed) {
      return true;
    }
    $(".image-name-edit").each(function () {
      if (changed) {
        return;
      }
      const $input = $(this);
      const original = String($input.attr("data-original-stem") || "").trim();
      const current = String($input.val() || "").trim();
      if (original !== current) {
        changed = true;
      }
    });
    if (changed) {
      return true;
    }
    state.albums.forEach(function (album) {
      if (changed || !album || album.isAll) {
        return;
      }
      if (typeof album.hiddenOriginal !== "boolean") {
        return;
      }
      if (!!album.hidden !== !!album.hiddenOriginal) {
        changed = true;
      }
    });
    if (changed) {
      return true;
    }
    if (buildHiddenImageChanges().length) {
      return true;
    }
    return changed;
  }

  function savePageEdits() {
    const payload = collectEditPayload();
    if (
      !payload.album_titles.length &&
      !payload.image_names.length &&
      !payload.hidden_albums.length &&
      !payload.hidden_images.length
    ) {
      return;
    }

    const activeAlbum = state.albums[state.activeIndex] || null;
    const preferredFolder =
      activeAlbum && !activeAlbum.isAll ? String(activeAlbum.folder || "") : "";
    $.ajax({
      url: buildApiUrl("__edit_page_save__"),
      method: "POST",
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify(payload),
    })
      .done(function (response) {
        if (!response || !response.ok) {
          showResultModal(
            (response && response.message) || t("edit_save_fail"),
            "error",
          );
          return;
        }
        showResultModal(t("edit_save_success"), "success");
        setEditingPage(false);
        loadAlbums(preferredFolder).catch(function () {
          renderError();
        });
      })
      .fail(function (xhr) {
        const failPayload = xhr && xhr.responseJSON;
        showResultModal(
          (failPayload && failPayload.message) || t("edit_save_fail"),
          "error",
        );
      });
  }

  function getLanguageMeta(code) {
    const pack = state.dict[code] || {};
    return {
      code: code,
      name: pack.lang_name || code.toUpperCase(),
      flag: pack.lang_flag || "🌐",
    };
  }

  function renderLanguageSwitches() {
    $languageSwitches.empty();

    Object.keys(state.dict).forEach(function (code) {
      const meta = getLanguageMeta(code);
      const isActive = code === state.lang;
      const $button = $(
        '<button class="theme-option language-option ' +
          (isActive ? "is-active" : "") +
          '" type="button" data-lang="' +
          code +
          '" aria-label="' +
          meta.name +
          '" title="' +
          meta.name +
          '">' +
          '<span class="icon flag-badge">' +
          meta.flag +
          "</span>" +
          '<span class="text">' +
          meta.name +
          "</span>" +
          "</button>",
      );

      $button.on("click", function () {
        changeLanguage(code);
      });

      $languageSwitches.append($button);
    });
  }

  function getThemeItems() {
    return [
      { value: "light", icon: "☀️", label: t("theme_light") },
      { value: "dark", icon: "🌙", label: t("theme_dark") },
      { value: "system", icon: "🖥️", label: t("theme_system") },
    ];
  }

  function renderThemeOptions() {
    $themeOptions.empty();
    getThemeItems().forEach(function (item) {
      const isActive = item.value === state.theme;
      const $button = $(
        '<button class="theme-option ' +
          (isActive ? "is-active" : "") +
          '" type="button" data-theme="' +
          item.value +
          '">' +
          '<span class="icon">' +
          item.icon +
          "</span>" +
          '<span class="text">' +
          item.label +
          "</span>" +
          "</button>",
      );

      $button.on("click", function () {
        state.theme = item.value;
        localStorage.setItem("album-viewer-theme", state.theme);
        applyTheme();
        applyColorPack();
        renderThemeOptions();
      });

      $themeOptions.append($button);
    });
  }

  function getColorItems() {
    return state.colorPacks.map(function (pack) {
      const text = pack.text || {};
      return {
        value: pack.value,
        lightColors: ((pack.colors || {}).light || []).slice(0, 5),
        darkColors: ((pack.colors || {}).dark || []).slice(0, 5),
        label: text[state.lang] || text.en || text.vi || pack.value,
      };
    });
  }

  function renderColorOptions() {
    $colorOptions.empty();
    getColorItems().forEach(function (item) {
      const isActive = item.value === state.colorPack;
      const $button = $(
        '<button class="theme-option color-option ' +
          (isActive ? "is-active" : "") +
          '" type="button" data-color-pack="' +
          item.value +
          '">' +
          '<span class="icon color-strip" aria-hidden="true">' +
          '<span class="color-strip-row color-strip-light">' +
          item.lightColors
            .map(function (hex) {
              return (
                '<span class="color-chip" style="background:' +
                hex +
                '"></span>'
              );
            })
            .join("") +
          "</span>" +
          '<span class="color-strip-row color-strip-dark">' +
          item.darkColors
            .map(function (hex) {
              return (
                '<span class="color-chip" style="background:' +
                hex +
                '"></span>'
              );
            })
            .join("") +
          "</span>" +
          "</span>" +
          '<span class="text">' +
          item.label +
          "</span>" +
          "</button>",
      );

      $button.on("click", function () {
        state.colorPack = item.value;
        localStorage.setItem("album-viewer-color-pack", state.colorPack);
        applyColorPack();
        renderColorOptions();
      });

      $colorOptions.append($button);
    });
  }

  function changeLanguage(nextLang) {
    state.lang = state.dict[nextLang] ? nextLang : defaultLang;
    localStorage.setItem("album-viewer-lang", state.lang);

    updateStaticTexts();

    if (state.hasError) {
      renderError();
      return;
    }

    if (!state.albums.length) {
      renderActiveAlbum();
      return;
    }

    renderAlbumList();
  }

  function bindSettingsEvents() {
    $sidebarToggle.on("click", function () {
      if (mobileMedia.matches) {
        state.mobileSidebarOpen = !state.mobileSidebarOpen;
        applyMobileSidebarState();
        return;
      }
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem(
        "album-viewer-sidebar-collapsed",
        state.sidebarCollapsed ? "1" : "0",
      );
      applySidebarState();
    });

    $mobileMenuToggle.on("click", function () {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
      applyMobileSidebarState();
    });

    $mobileSidebarOverlay.on("click", function () {
      state.mobileSidebarOpen = false;
      applyMobileSidebarState();
    });

    $settingsToggle.on("click", function () {
      $settingsPanel.removeClass("is-hidden");
    });

    $sidebarEditPage.on("click", function () {
      if (!String(state.authUser || "").trim()) {
        showResultModal(t("edit_auth_required"), "error");
        return;
      }
      if (
        String(state.authRole || "")
          .trim()
          .toLowerCase() !== "admin"
      ) {
        showResultModal(t("edit_auth_required"), "error");
        return;
      }
      setEditingPage(true);
    });

    $sidebarEditSave.on("click", function () {
      if (!hasPendingEdits()) {
        setEditingPage(false);
        return;
      }
      openConfirmModal(t("edit_save_confirm")).then(function (confirmed) {
        if (!confirmed) {
          return;
        }
        savePageEdits();
      });
    });

    $sidebarEditCancel.on("click", function () {
      if (!hasPendingEdits()) {
        setEditingPage(false);
        return;
      }
      openConfirmModal(t("edit_cancel_confirm")).then(function (confirmed) {
        if (!confirmed) {
          return;
        }
        setEditingPage(false);
      });
    });

    $settingsLogout.on("click", function () {
      if (!$settingsLogout.is(":visible")) {
        return;
      }
      const $button = $(this);
      $button.prop("disabled", true);
      $.ajax({
        url: buildApiUrl("__auth_logout__"),
        method: "POST",
        dataType: "json",
      })
        .done(function (response) {
          if (response && response.ok) {
            state.authUser = "";
            resetHiddenDrafts();
            resetHiddenImageDrafts();
            state.editingPage = false;
            $("body").removeClass("is-page-editing");
            updateAuthUi();
            $settingsPanel.addClass("is-hidden");
            window.location.reload();
          }
        })
        .always(function () {
          $button.prop("disabled", false);
        });
    });

    $(document).on("click", function (event) {
      const target = event.target;
      if (!$(target).closest(".settings-dock").length) {
        $settingsPanel.addClass("is-hidden");
      }
    });

    $radiusRange.on("input change", function () {
      const nextValue = Number($(this).val());
      if (Number.isNaN(nextValue)) {
        return;
      }
      state.radius = Math.min(2, Math.max(0, nextValue));
      localStorage.setItem("album-viewer-radius", state.radius.toFixed(2));
      applyRadius();
      renderRadiusControl();
    });

    $albumSearchInput.on("input", function () {
      state.searchQuery = String($(this).val() || "");
      updateSearchClearState();
      renderActiveAlbum();
    });

    $albumSearchClear.on("click", function () {
      $albumSearchInput.val("");
      state.searchQuery = "";
      updateSearchClearState();
      renderActiveAlbum();
      $albumSearchInput.trigger("focus");
    });

    $albumUploadButton.on("click", function () {
      if (!state.authUser) {
        const msg = t("upload_album_auth_required");
        $uploadError.text(msg);
        showResultModal(msg, "warning");
        return;
      }
      openUploadModal();
    });

    $audioUploadButton.on("click", function () {
      if (state.uploadingAudio) {
        return;
      }
      if (!state.authUser) {
        showResultModal(t("upload_audio_auth_required"), "warning");
        return;
      }
      openAudioUploadModal();
    });

    $audioUploadPlayAll.on("click", function () {
      if (state.previewAudioAutoAdvance) {
        stopPreviewAudio(false);
        stopPreviewAutoAdvance();
        return;
      }
      startPreviewAutoAdvance();
    });

    $audioPreviewPrev.on("click", function () {
      playPreviewTrackByOffset(-1);
    });

    $audioPreviewNext.on("click", function () {
      playPreviewTrackByOffset(1);
    });

    $audioUploadModal.on(
      "click",
      "[data-role='close-audio-upload-modal']",
      function () {
        closeAudioUploadModal();
      },
    );

    $invitationLinkModal.on(
      "click",
      "[data-role='close-invitation-link-modal']",
      function () {
        closeInvitationLinkModal();
      },
    );

    $invitationLinkSubmit.on("click", function () {
      submitInvitationLinkCreate();
    });

    $invitationLinkFormHeader.on("click", function () {
      setInvitationLinkFormCollapsed(
        !$invitationLinkFormSection.hasClass("is-collapsed"),
      );
    });

    $invitationLinkEditCancel.on("click", function () {
      resetInvitationLinkForm();
      $invitationLinkError.text("");
      window.setTimeout(function () {
        $invitationLinkName.trigger("focus");
      }, 0);
    });

    $invitationLinkName.on("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        submitInvitationLinkCreate();
      }
    });

    $invitationLinkList.on("click", ".invitation-link-copy", function () {
      const linkPath = String($(this).attr("data-link-path") || "").trim();
      if (!linkPath) {
        showResultModal("Không tìm thấy link thiệp để copy.", "error");
        return;
      }
      copyTextToClipboard(toAbsoluteUrl(linkPath))
        .then(function () {
          showResultModal("Đã copy link thiệp mời.", "success");
        })
        .fail(function () {
          showResultModal("Không copy được link thiệp mời.", "error");
        });
    });

    $invitationLinkList.on("click", ".invitation-link-edit", function () {
      const code = String($(this).attr("data-code") || "").trim();
      if (!code) {
        return;
      }
      const currentEntry = state.invitationLinks.find(function (entry) {
        return String(entry && entry.code ? entry.code : "").trim() === code;
      });
      if (!currentEntry) {
        showResultModal("Không tìm thấy thiệp để chỉnh sửa.", "error");
        return;
      }
      fillInvitationLinkForm(currentEntry);
    });

    $invitationLinkList.on("click", ".invitation-link-toggle", function () {
      const code = String($(this).attr("data-code") || "").trim();
      if (!code) {
        return;
      }
      const currentEntry = state.invitationLinks.find(function (entry) {
        return String(entry && entry.code ? entry.code : "").trim() === code;
      });
      const nextVisible = !(
        currentEntry &&
        Object.prototype.hasOwnProperty.call(currentEntry, "guestbook_visible") &&
        !currentEntry.guestbook_visible
      );
      $.ajax({
        url: buildApiUrl("__invitation_links__"),
        method: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({
          code: code,
          guestbook_visible: !nextVisible,
        }),
      })
        .done(function (response) {
          if (!response || !response.ok) {
            showResultModal(
              (response && response.message) ||
                "Không cập nhật được trạng thái lời chúc.",
              "error",
            );
            return;
          }
          renderInvitationLinkList(
            Array.isArray(response.entries) ? response.entries : [],
          );
          showResultModal(
            !nextVisible
              ? "Đã bật hiển thị lời chúc trên trang thiệp."
              : "Đã ẩn lời chúc trên trang thiệp.",
            "success",
          );
        })
        .fail(function (xhr) {
          const response = xhr && xhr.responseJSON;
          showResultModal(
            (response && response.message) ||
              "Không cập nhật được trạng thái lời chúc.",
            "error",
          );
        });
    });

    $invitationLinkList.on("click", ".invitation-link-delete", function () {
      const code = String($(this).attr("data-code") || "").trim();
      if (!code) {
        return;
      }
      openConfirmModal("Xóa thiệp mời này?").then(function (confirmed) {
        if (!confirmed) {
          return;
        }
        $.ajax({
          url: buildApiUrl("__invitation_links__"),
          method: "POST",
          contentType: "application/json",
          dataType: "json",
          data: JSON.stringify({
            code: code,
            delete: true,
          }),
        })
          .done(function (response) {
            if (!response || !response.ok) {
              showResultModal(
                (response && response.message) || "Không xóa được thiệp mời.",
                "error",
              );
              return;
            }
            renderInvitationLinkList(
              Array.isArray(response.entries) ? response.entries : [],
            );
            showResultModal("Đã xóa thiệp mời.", "success");
          })
          .fail(function (xhr) {
            const response = xhr && xhr.responseJSON;
            showResultModal(
              (response && response.message) || "Không xóa được thiệp mời.",
              "error",
            );
          });
      });
    });

    $audioList.on("click", ".audio-table-delete", function () {
      const filename = $(this).attr("data-filename") || "";
      if (!filename || !state.authUser) {
        return;
      }
      const msg = t("upload_audio_delete_confirm", { file: filename });
      openConfirmModal(msg).then(function (confirmed) {
        if (!confirmed) {
          return;
        }
        $.ajax({
          url: buildApiUrl("__delete_audio__"),
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify({ file: filename }),
          dataType: "json",
        })
          .done(function (response) {
            if (response && response.ok) {
              showResultModal(t("upload_audio_delete_success"), "success");
              loadAudioList();
              if (state.previewAudioFile === filename) {
                closePreviewPanel();
              }
            } else {
              showResultModal(
                (response && response.message) || t("upload_audio_delete_fail"),
                "error",
              );
            }
          })
          .fail(function (xhr) {
            const payload = xhr && xhr.responseJSON;
            showResultModal(
              (payload && payload.message) || t("upload_audio_delete_fail"),
              "error",
            );
          });
      });
    });

    $audioList.on("click", ".audio-table-play", function () {
      const filename = $(this).attr("data-filename") || "";
      if (!filename) {
        return;
      }
      ensurePreviewAnchor($(this).closest("tr"));
      if (state.previewAudioFile === filename) {
        if (state.previewAudioPlaying) {
          previewAudio.pause();
          setPreviewPlaying(false);
        } else {
          previewAudio
            .play()
            .then(function () {
              setPreviewPlaying(true);
            })
            .catch(function () {});
        }
        return;
      }
      playPreviewAudio(filename);
    });

    $audioList.on("dragstart", ".audio-table-row", function (event) {
      if (!canManageAudioOrder()) {
        event.preventDefault();
        return;
      }
      const filename = $(this).attr("data-filename") || "";
      if (!filename) {
        return;
      }
      const nativeEvent = event.originalEvent;
      if (nativeEvent && nativeEvent.dataTransfer) {
        nativeEvent.dataTransfer.effectAllowed = "move";
        nativeEvent.dataTransfer.setData("text/plain", filename);
      }
      $(this).addClass("is-dragging");
    });

    $audioList.on("dragend", ".audio-table-row", function () {
      $(this).removeClass("is-dragging");
      $audioList.find(".audio-table-row").removeClass("is-drag-over");
    });

    $audioList.on("dragover", ".audio-table-row", function (event) {
      if (!canManageAudioOrder()) {
        return;
      }
      event.preventDefault();
      const nativeEvent = event.originalEvent;
      if (nativeEvent && nativeEvent.dataTransfer) {
        nativeEvent.dataTransfer.dropEffect = "move";
      }
      $(this).addClass("is-drag-over");
    });

    $audioList.on("dragleave", ".audio-table-row", function () {
      $(this).removeClass("is-drag-over");
    });

    $audioList.on("drop", ".audio-table-row", function (event) {
      if (!canManageAudioOrder()) {
        return;
      }
      event.preventDefault();
      const nativeEvent = event.originalEvent;
      const filename =
        nativeEvent && nativeEvent.dataTransfer
          ? nativeEvent.dataTransfer.getData("text/plain")
          : "";
      if (!filename) {
        return;
      }
      const $dragRow = $audioList.find(
        'tr[data-filename="' + CSS.escape(filename) + '"]',
      );
      if (!$dragRow.length) {
        return;
      }
      const $target = $(this);
      if ($target.get(0) === $dragRow.get(0)) {
        return;
      }
      if ($dragRow.index() < $target.index()) {
        $target.after($dragRow);
      } else {
        $target.before($dragRow);
      }
      $audioList.find(".audio-table-row").removeClass("is-drag-over");
      updateAudioOrderFromDom();
    });

    $audioPreviewToggle.on("click", function () {
      if (!state.previewAudioFile) {
        return;
      }
      if (state.previewAudioPlaying) {
        previewAudio.pause();
        setPreviewPlaying(false);
        return;
      }
      previewAudio
        .play()
        .then(function () {
          setPreviewPlaying(true);
        })
        .catch(function () {});
    });

    $audioPreviewClose.on("click", function () {
      closePreviewPanel();
    });

    $audioPreviewVolumeRange.on("input change", function () {
      const nextValue = Number($(this).val());
      if (Number.isNaN(nextValue)) {
        return;
      }
      setPreviewAudioVolume(nextValue / 100);
    });

    let isPreviewSeeking = false;

    function applyPreviewSeekFromInput() {
      const nextValue = Number($audioPreviewSeek.val());
      if (!Number.isFinite(nextValue)) {
        return;
      }
      const ratio = Math.max(0, Math.min(1, nextValue / 100));
      $audioPreviewSeek.css("--seek", (ratio * 100).toFixed(2) + "%");
      seekPreviewAudioByRatio(ratio);
    }

    $audioPreviewSeek.on("pointerdown mousedown touchstart", function () {
      isPreviewSeeking = true;
    });

    $audioPreviewSeek.on("input", function () {
      applyPreviewSeekFromInput();
    });

    $audioPreviewSeek.on(
      "change pointerup pointercancel mouseup touchend touchcancel",
      function () {
        applyPreviewSeekFromInput();
        isPreviewSeeking = false;
      },
    );

    function positionPreviewVolumePopover() {
      if (!$audioPreviewVolumeWrap.hasClass("is-open")) {
        return;
      }
      const toggleEl = $audioPreviewVolumeToggle.get(0);
      if (!toggleEl) {
        return;
      }
      const rect = toggleEl.getBoundingClientRect();
      $audioPreviewVolumePopover.css({
        left: rect.left + rect.width / 2,
        top: rect.top - 8,
      });
    }

    function closePreviewVolumePopover() {
      $audioPreviewVolumeWrap.removeClass("is-open");
      $audioPreviewVolumePopover.attr("aria-hidden", "true");
    }

    function togglePreviewVolumePopover() {
      const isOpen = $audioPreviewVolumeWrap.hasClass("is-open");
      if (isOpen) {
        closePreviewVolumePopover();
        return;
      }
      $audioPreviewVolumeWrap.addClass("is-open");
      $audioPreviewVolumePopover.attr("aria-hidden", "false");
      positionPreviewVolumePopover();
    }

    $audioPreviewVolumeToggle.on("click", function (event) {
      event.stopPropagation();
      if ($audioPreviewVolumeWrap.hasClass("is-open")) {
        const current = Number.isFinite(state.previewAudioVolume)
          ? state.previewAudioVolume
          : 0;
        setPreviewAudioVolume(current > 0 ? 0 : 0.6);
        return;
      }
      togglePreviewVolumePopover();
    });

    $audioPreviewVolumeWrap.on("mousedown touchstart click", function (event) {
      event.stopPropagation();
    });

    $audioPreviewVolumePopover.on(
      "mousedown touchstart click",
      function (event) {
        event.stopPropagation();
      },
    );

    $(document).on("mousedown touchstart", function () {
      closePreviewVolumePopover();
    });

    $(window).on("resize", function () {
      positionPreviewVolumePopover();
    });

    $audioTableWrap.on("scroll", function () {
      positionPreviewVolumePopover();
    });

    $audioUploadSubmit.on("click", function () {
      if (state.uploadingAudio) {
        return;
      }
      if (!state.authUser) {
        const msgAuth = t("upload_audio_auth_required");
        $audioUploadError.text(msgAuth);
        showResultModal(msgAuth, "warning");
        return;
      }
      const files = $audioUploadInput.get(0).files;
      if (!files || !files.length) {
        const msgFiles = t("upload_audio_file_required");
        $audioUploadError.text(msgFiles);
        showResultModal(msgFiles, "warning");
        return;
      }
      $audioUploadError.text("");
      const formData = new FormData();
      Array.from(files).forEach(function (file) {
        formData.append("files[]", file, file.name);
      });
      state.uploadingAudio = true;
      $audioUploadButton.prop("disabled", true).addClass("is-loading");
      $audioUploadSubmit.prop("disabled", true);
      $audioUploadCancel.prop("disabled", true);
      $.ajax({
        url: buildApiUrl("__upload_audio__"),
        method: "POST",
        data: formData,
        processData: false,
        contentType: false,
        dataType: "json",
      })
        .done(function (response) {
          if (!response || !response.ok) {
            const failMessage =
              (response && response.message) || t("upload_audio_fail");
            $audioUploadError.text(failMessage);
            showResultModal(failMessage, "error");
            return;
          }
          showResultModal(
            t("upload_audio_success", { count: Number(response.saved || 0) }),
            "success",
          );
          loadAudioList();
          $audioUploadInput.val("");
          $audioUploadError.text("");
        })
        .fail(function (xhr) {
          const payload = xhr && xhr.responseJSON;
          const failMessage =
            (payload && payload.message) || t("upload_audio_fail");
          $audioUploadError.text(failMessage);
          showResultModal(failMessage, "error");
        })
        .always(function () {
          state.uploadingAudio = false;
          $audioUploadButton.prop("disabled", false).removeClass("is-loading");
          $audioUploadSubmit.prop("disabled", false);
          $audioUploadCancel.prop("disabled", false);
        });
    });

    $uploadTypeOptions.on("click", ".upload-type-btn", function () {
      const nextType = String($(this).attr("data-upload-type") || "");
      if (!["files", "folder", "zip"].includes(nextType)) {
        return;
      }
      const wasType = state.uploadType;
      state.uploadType = nextType;
      syncUploadTypeUi();
      if (nextType === "folder" && wasType !== "folder") {
        showResultModal(t("upload_folder_browser_notice"), "info");
      }
    });

    $uploadFolderInput.on("change", function () {
      autofillAlbumNameIfEmpty("folder", this.files || []);
    });

    $uploadZipInput.on("change", function () {
      autofillAlbumNameIfEmpty("zip", this.files || []);
    });

    $uploadAlbumName.on("input", function () {
      const value = String($uploadAlbumName.val() || "").trim();
      $uploadAlbumName.toggleClass("has-error", !value);
      if (value) {
        $uploadAlbumError.addClass("is-hidden").text("");
      }
    });

    function clearUploadFileError() {
      $uploadFilesError.addClass("is-hidden").text("");
      $uploadFilesInput.removeClass("has-error");
      $uploadFolderInput.removeClass("has-error");
      $uploadZipInput.removeClass("has-error");
    }

    $uploadFilesInput.on("change", function () {
      clearUploadFileError();
    });
    $uploadFolderInput.on("change", function () {
      clearUploadFileError();
    });
    $uploadZipInput.on("change", function () {
      clearUploadFileError();
    });

    $uploadModal.on("click", "[data-role='close-upload-modal']", function () {
      closeUploadModal();
    });
    $confirmModal.on("click", "[data-role='close-confirm-modal']", function () {
      closeConfirmModal(false);
    });
    $confirmYes.on("click", function () {
      closeConfirmModal(true);
    });

    $uploadSubmit.on("click", function () {
      if (state.uploading) {
        return;
      }
      if (!state.authUser) {
        const msgAuth = t("upload_album_auth_required");
        $uploadError.text(msgAuth);
        showResultModal(msgAuth, "warning");
        return;
      }
      const albumName = String($uploadAlbumName.val() || "").trim();
      $uploadAlbumName.toggleClass("has-error", !albumName);
      if (!albumName) {
        const msgAlbum = t("upload_album_name_required");
        $uploadAlbumError.removeClass("is-hidden").text(msgAlbum);
        showResultModal(msgAlbum, "warning");
        return;
      }
      const files = getSelectedUploadFiles();
      const hasFiles = !!(files && files.length);
      $uploadFilesInput.prop("required", hasFiles);
      $uploadFolderInput.prop("required", hasFiles);
      $uploadZipInput.prop("required", hasFiles);
      if (!files || !files.length) {
        const msgFiles = t("upload_file_required");
        $uploadFilesError.removeClass("is-hidden").text(msgFiles);
        $uploadFilesInput.addClass("has-error");
        $uploadFolderInput.addClass("has-error");
        $uploadZipInput.addClass("has-error");
        showResultModal(msgFiles, "warning");
        return;
      }
      $uploadError.text("");
      $uploadAlbumError.addClass("is-hidden").text("");
      $uploadFilesError.addClass("is-hidden").text("");
      $uploadAlbumName.removeClass("has-error");
      clearUploadFileError();

      const formData = new FormData();
      formData.append("album", albumName);
      formData.append("upload_type", state.uploadType);
      Array.from(files).forEach(function (file) {
        if (state.uploadType === "zip") {
          formData.append("zip_file", file, file.name);
        } else {
          formData.append("files[]", file, file.name);
        }
      });

      state.uploading = true;
      $uploadSubmit.prop("disabled", true);
      $uploadCancel.prop("disabled", true);
      $albumUploadButton.prop("disabled", true).addClass("is-loading");
      $.ajax({
        url: buildApiUrl("__upload_album__", {
          album: albumName,
          upload_type: state.uploadType,
        }),
        method: "POST",
        data: formData,
        processData: false,
        contentType: false,
        dataType: "json",
      })
        .done(function (response) {
          if (!response || !response.ok) {
            const failMessage =
              (response && response.message) || t("upload_album_fail");
            $uploadError.text(failMessage);
            showResultModal(failMessage, "error");
            return;
          }
          const uploadedAlbumFolder = String(response.album || albumName);
          const uploadedAlbumTitle = String(response.album_title || albumName);
          if (uploadedAlbumFolder && uploadedAlbumTitle) {
            state.albumTitleOverrides[uploadedAlbumFolder] = uploadedAlbumTitle;
          }
          const uploadedCount = Number(response.saved || 0);
          const queued = Boolean(response.build && response.build.queued);
          const successText = t("upload_album_success", {
            count: uploadedCount,
            album: uploadedAlbumTitle,
          });
          showResultModal(
            queued
              ? successText + "\n" + t("upload_album_queued")
              : successText,
            "success",
          );
          closeUploadModal();
          if (queued) {
            pollBuildAndReload(uploadedAlbumFolder);
            return;
          }
          loadAlbums(uploadedAlbumFolder).catch(function () {
            renderError();
          });
        })
        .fail(function (xhr) {
          const payload = xhr && xhr.responseJSON;
          const failMessage =
            (payload && payload.message) || t("upload_album_fail");
          $uploadError.text(failMessage);
          showResultModal(failMessage, "error");
        })
        .always(function () {
          state.uploading = false;
          $uploadSubmit.prop("disabled", false);
          $uploadCancel.prop("disabled", false);
          $albumUploadButton.prop("disabled", false).removeClass("is-loading");
        });
    });

    $(document).on("keydown", function (event) {
      if (event.key === "Escape" && !$uploadModal.hasClass("is-hidden")) {
        closeUploadModal();
        return;
      }
      if (event.key === "Escape" && !$audioUploadModal.hasClass("is-hidden")) {
        closeAudioUploadModal();
        return;
      }
      if (
        event.key === "Escape" &&
        !$invitationLinkModal.hasClass("is-hidden")
      ) {
        closeInvitationLinkModal();
        return;
      }
      if (event.key === "Escape" && !$confirmModal.hasClass("is-hidden")) {
        closeConfirmModal(false);
        return;
      }
    });
  }

  function toCaptionBaseName(fileName) {
    const name = String(fileName || "").trim();
    return name.replace(/\.[^.]+$/, "");
  }

  function normalizeSearchToken(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[_\s]+/g, " ")
      .trim();
  }

  function updateViewerCaption(rawCaption) {
    const fullText = String(rawCaption || "").trim();
    const el = $imageViewerCaption.get(0);
    state.viewerCaptionRaw = fullText;
    if (!el) {
      return;
    }

    $imageViewerCaption.text(fullText).attr("title", fullText);
    if (!mobileMedia.matches || !fullText) {
      return;
    }

    if (el.scrollWidth <= el.clientWidth) {
      return;
    }

    let left = 1;
    let right = fullText.length;
    let best = "...";
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const candidate = fullText.slice(0, mid) + "...";
      $imageViewerCaption.text(candidate);
      if (el.scrollWidth <= el.clientWidth) {
        best = candidate;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    $imageViewerCaption.text(best);
  }

  function flashEvent($el, className) {
    const cls = className || "event-flash";
    $el.removeClass(cls);
    // Restart CSS animation reliably.
    void $el.get(0).offsetWidth;
    $el.addClass(cls);
    window.setTimeout(function () {
      $el.removeClass(cls);
    }, 260);
  }

  function showViewerLoading() {
    state.viewerLoadingSince = Date.now();
    $imageViewerLoading.removeClass("is-hidden");
  }

  function updateViewerSidebarState() {
    const hidden = !!state.viewerSidebarHidden;
    $imageViewer.toggleClass("is-sidebar-hidden", hidden);
    if (!$imageViewerSidebarToggle.length) {
      return;
    }
    $imageViewerSidebarToggle
      .attr("aria-label", hidden ? "Show sidebar" : "Hide sidebar")
      .attr("title", hidden ? "Show sidebar" : "Hide sidebar");
  }

  function hideViewerLoading() {
    const elapsed = Date.now() - state.viewerLoadingSince;
    const wait = Math.max(0, viewerMinLoadingMs - elapsed);
    window.setTimeout(function () {
      $imageViewerLoading.addClass("is-hidden");
    }, wait);
  }

  function preloadImageSource(src) {
    const target = String(src || "").trim();
    if (!target) {
      return Promise.resolve(false);
    }
    if (state.viewerPreloadCache[target]) {
      return Promise.resolve(true);
    }
    if (state.viewerPreloadPromises[target]) {
      return state.viewerPreloadPromises[target];
    }
    state.viewerPreloadPromises[target] = new Promise(function (resolve) {
      const probe = new Image();
      const done = function (ok) {
        if (ok) {
          state.viewerPreloadCache[target] = true;
        }
        delete state.viewerPreloadPromises[target];
        resolve(ok);
      };
      probe.onload = function () {
        done(true);
      };
      probe.onerror = function () {
        done(false);
      };
      probe.src = target;
    });
    return state.viewerPreloadPromises[target];
  }

  function preloadViewerItem(index) {
    if (!state.viewerItems.length) {
      return Promise.resolve(false);
    }
    const clamped = Math.max(
      0,
      Math.min(state.viewerItems.length - 1, Number(index) || 0),
    );
    const item = state.viewerItems[clamped];
    if (!item) {
      return Promise.resolve(false);
    }
    const targets = [item.viewSrc, item.downloadSrc].filter(
      function (value, i, arr) {
        return !!value && arr.indexOf(value) === i;
      },
    );
    if (!targets.length) {
      return Promise.resolve(false);
    }
    return Promise.all(targets.map(preloadImageSource)).then(
      function (results) {
        return results.some(Boolean);
      },
    );
  }

  function openImageViewer(
    src,
    fileName,
    alt,
    downloadSrc,
    downloadName,
    options,
  ) {
    const opts = options && typeof options === "object" ? options : {};
    const suppressLoading = !!opts.suppressLoading;
    const smoothSwap = !!opts.smoothSwap;
    const baseName = toCaptionBaseName(fileName);
    const downloadTarget = String(downloadSrc || src || "").trim();
    const downloadFileName =
      String(downloadName || fileName || "").trim() || "image";
    const primarySrc = String(src || "").trim();
    const fallbackSrc = String(downloadTarget || "").trim();
    let triedFallback = false;
    if (!suppressLoading) {
      showViewerLoading();
      $imageViewerImg.attr("src", "");
    } else {
      $imageViewerLoading.addClass("is-hidden");
    }
    $imageViewerImg.attr("alt", alt || baseName || "");
    $imageViewerDownload.attr("href", downloadTarget || "#");
    $imageViewerDownload.attr("download", downloadFileName);
    $imageViewer.removeClass("is-hidden").attr("aria-hidden", "false");
    updateViewerCaption(baseName);
    $("body").addClass("is-viewer-open");
    $imageViewerCanvas.scrollTop(0).scrollLeft(0);
    setViewerZoom(1);
    setViewerRotation(0);

    $imageViewerImg.off("load.viewerload error.viewerload");
    $imageViewerImg.on("load.viewerload", function () {
      if (!suppressLoading) {
        hideViewerLoading();
      }
      if (smoothSwap) {
        $imageViewerImg.removeClass("is-smooth-switch");
      }
    });
    $imageViewerImg.on("error.viewerload", function () {
      if (!triedFallback && fallbackSrc && fallbackSrc !== primarySrc) {
        triedFallback = true;
        if (smoothSwap) {
          $imageViewerImg.addClass("is-smooth-switch");
        }
        $imageViewerImg.attr("src", fallbackSrc);
        return;
      }
      if (!suppressLoading) {
        hideViewerLoading();
      }
      if (smoothSwap) {
        $imageViewerImg.removeClass("is-smooth-switch");
      }
    });

    if (smoothSwap) {
      $imageViewerImg.addClass("is-smooth-switch");
    }
    $imageViewerImg.attr("src", primarySrc || fallbackSrc);
  }

  function getViewerSourceContext() {
    if (!state.albums.length) {
      return { albumTitle: "", images: [] };
    }
    const album = state.albums[state.activeIndex] || state.albums[0];
    const searchTerm = String(state.searchQuery || "").trim();
    let images = Array.isArray(album.images) ? album.images : [];
    let albumTitle = album.isAll
      ? t("view_all")
      : album.title || t("album_unnamed");
    const hiddenFolders = getHiddenFolderSet();

    if (!state.editingPage && album && !album.isAll && album.hidden) {
      return { albumTitle: albumTitle, images: [] };
    }

    if (searchTerm) {
      const needle = normalizeSearchToken(searchTerm);
      images = [];
      const searchAlbums = state.editingPage
        ? state.albums.slice(1)
        : state.albums.filter(function (item) {
            return item && !item.isAll && !item.hidden;
          });
      searchAlbums.forEach(function (item) {
        const folder = item.folder || "";
        (Array.isArray(item.images) ? item.images : []).forEach(
          function (imageEntry) {
            const normalized = normalizeImageEntry(imageEntry);
            const haystack = normalizeSearchToken(
              folder + "/" + (normalized.original || normalized.name || ""),
            );
            if (haystack.indexOf(needle) !== -1) {
              images.push({
                folder: folder,
                name: normalized.name,
                root: normalized.root,
                detail: normalized.detail,
                detail_root: normalized.detailRoot,
                original: normalized.original,
                original_root: normalized.originalRoot,
                uploaded_at: normalized.uploadedAt,
                created_at: normalized.createdAt,
              });
            }
          },
        );
      });
      albumTitle = t("search_title");
    } else if (!album.isAll) {
      images = images.map(function (entry) {
        const normalized = normalizeImageEntry(entry);
        return {
          folder: album.folder || "",
          name: normalized.name,
          root: normalized.root,
          detail: normalized.detail,
          detail_root: normalized.detailRoot,
          original: normalized.original,
          original_root: normalized.originalRoot,
          uploaded_at: normalized.uploadedAt,
          created_at: normalized.createdAt,
        };
      });
    } else if (!state.editingPage && hiddenFolders.size) {
      images = images.filter(function (entry) {
        return !hiddenFolders.has(
          String(entry && entry.folder ? entry.folder : ""),
        );
      });
    }

    return { albumTitle: albumTitle, images: sortImageEntries(images) };
  }

  function buildViewerItems() {
    const context = getViewerSourceContext();
    const albumTitle = context.albumTitle;
    return (context.images || [])
      .filter(function (entry) {
        const folder = entry && entry.folder ? entry.folder : "";
        const name = entry && (entry.original || entry.name || "");
        return !isImageHidden(folder, name);
      })
      .map(function (entry) {
        const folder = entry.folder || "";
        const normalized = normalizeImageEntry(entry);
        const info = resolveImageInfo(folder, normalized);
        const pathPart = folder
          ? folder + "/" + normalized.name
          : normalized.name;
        return {
          viewSrc: info.detailPath,
          viewName: info.detailName,
          alt: albumTitle + " - " + pathPart,
          thumbSrc: info.imagePath,
          thumbAlt: pathPart,
          downloadSrc: info.originalPath,
          downloadName: info.originalName,
        };
      })
      .filter(function (item) {
        return !!item.viewSrc;
      });
  }

  function updateViewerNavButtons() {
    const hasItems = state.viewerItems.length > 0;
    const atFirst = state.viewerIndex <= 0;
    const atLast = state.viewerIndex >= state.viewerItems.length - 1;
    $imageViewerPrev.prop("disabled", !hasItems || atFirst);
    $imageViewerNext.prop("disabled", !hasItems || atLast);
  }

  function syncViewerThumbActive() {
    const activeIndex = state.viewerIndex;
    const $items = $imageViewerThumbList.find(".image-viewer-thumb");
    $items.removeClass("is-active").attr("aria-current", "false");
    if (activeIndex < 0) {
      return;
    }
    const $active = $items.filter('[data-index="' + activeIndex + '"]');
    if (!$active.length) {
      return;
    }
    $active.addClass("is-active").attr("aria-current", "true");
    if (state.viewerSidebarHidden) {
      return;
    }
    const activeEl = $active.get(0);
    if (activeEl && typeof activeEl.scrollIntoView === "function") {
      activeEl.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: "smooth",
      });
    }
  }

  function renderViewerThumbList() {
    $imageViewerThumbList.empty();
    if (!state.viewerItems.length) {
      return;
    }
    const fragment = document.createDocumentFragment();
    state.viewerItems.forEach(function (item, index) {
      const thumbLabel = toCaptionBaseName(
        item.downloadName || item.viewName || "",
      );
      const button = document.createElement("button");
      button.type = "button";
      button.className = "image-viewer-thumb";
      button.setAttribute("data-index", String(index));
      button.setAttribute("aria-label", thumbLabel || "Image " + (index + 1));
      button.setAttribute("title", thumbLabel || "Image " + (index + 1));

      const img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.src = item.thumbSrc || item.viewSrc || "";
      img.alt = item.thumbAlt || thumbLabel || "";
      button.appendChild(img);

      button.addEventListener("click", function () {
        openViewerItemByIndex(index);
      });
      fragment.appendChild(button);
    });
    $imageViewerThumbList.get(0).appendChild(fragment);
    syncViewerThumbActive();
  }

  function openViewerItemByIndex(nextIndex, options) {
    if (!state.viewerItems.length) {
      return;
    }
    const clamped = Math.max(
      0,
      Math.min(state.viewerItems.length - 1, Number(nextIndex) || 0),
    );
    const item = state.viewerItems[clamped];
    state.viewerIndex = clamped;
    updateViewerNavButtons();
    updateSlideshowCounter();
    syncViewerThumbActive();
    openImageViewer(
      item.viewSrc,
      item.viewName,
      item.alt,
      item.downloadSrc,
      item.downloadName,
      options,
    );
    preloadViewerItem((clamped + 1) % state.viewerItems.length);
  }

  function requestViewerFullscreen() {
    const el = $imageViewer.get(0);
    if (!el || !el.requestFullscreen) {
      return;
    }
    const result = el.requestFullscreen();
    if (result && typeof result.catch === "function") {
      result.catch(function () {});
    }
  }

  function exitViewerFullscreen() {
    const active = document.fullscreenElement;
    const viewerEl = $imageViewer.get(0);
    if (!active || !viewerEl) {
      return;
    }
    if (active !== viewerEl) {
      return;
    }
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
  }

  function setSlideshowMode(enabled) {
    state.slideshowMode = !!enabled;
    $imageViewer.toggleClass("is-slideshow-mode", state.slideshowMode);
    if (state.slideshowMode) {
      state.slideshowControlsVisible = !mobileMedia.matches;
      applySlideshowControlsVisibility();
      state.viewerSidebarHidden = true;
      updateViewerSidebarState();
      updateSlideshowCounter();
      requestViewerFullscreen();
      updateAudioToggleState();
      return;
    }
    pauseSlideshowAudio(false);
    $imageViewerAudioPopover
      .addClass("is-hidden")
      .removeClass("is-open")
      .attr("aria-hidden", "true");
    updateAudioToggleState();
    state.slideshowControlsVisible = true;
    applySlideshowControlsVisibility();
    state.viewerSidebarHidden = false;
    updateViewerSidebarState();
    exitViewerFullscreen();
  }

  function applySlideshowControlsVisibility() {
    const hide =
      state.slideshowMode &&
      mobileMedia.matches &&
      !state.slideshowControlsVisible;
    $imageViewer.toggleClass("is-slideshow-controls-hidden", hide);
  }

  function clearSlideshowTimer() {
    if (state.slideshowTimer) {
      window.clearTimeout(state.slideshowTimer);
      state.slideshowTimer = null;
    }
  }

  function stopSlideshow() {
    state.slideshowPlaying = false;
    clearSlideshowTimer();
    setSlideshowMode(false);
    updateSlideshowButtonState();
  }

  function pauseSlideshow() {
    state.slideshowPlaying = false;
    clearSlideshowTimer();
    pauseSlideshowAudio(false);
    updateSlideshowButtonState();
  }

  function resumeSlideshow() {
    if (!state.viewerItems.length) {
      return;
    }
    state.slideshowPlaying = true;
    updateSlideshowButtonState();
    scheduleSlideshowStep();
    ensureSlideshowAudioList({ autoplay: true });
  }

  function scheduleSlideshowStep() {
    clearSlideshowTimer();
    if (!state.slideshowPlaying || !state.viewerItems.length) {
      return;
    }
    const nextIndex =
      (state.viewerIndex + 1 + state.viewerItems.length) %
      state.viewerItems.length;
    const preloadPromise = preloadViewerItem(nextIndex);
    state.slideshowTimer = window.setTimeout(function () {
      if (!state.slideshowPlaying || !state.viewerItems.length) {
        return;
      }
      Promise.race([
        preloadPromise,
        new Promise(function (resolve) {
          window.setTimeout(resolve, 900);
        }),
      ]).then(function () {
        if (!state.slideshowPlaying || !state.viewerItems.length) {
          return;
        }
        openViewerItemByIndex(nextIndex, {
          suppressLoading: true,
          smoothSwap: true,
        });
        scheduleSlideshowStep();
      });
    }, 3500);
  }

  function startSlideshow() {
    const items = getCurrentSlideshowItems();
    if (!items.length) {
      updateSlideshowButtonState();
      return;
    }
    state.viewerSidebarHidden = true;
    state.viewerItems = items;
    renderViewerThumbList();
    state.slideshowPlaying = true;
    setSlideshowMode(true);
    ensureSlideshowAudioList({ showEmpty: true, autoplay: true });

    if (
      $imageViewer.hasClass("is-hidden") ||
      state.viewerIndex < 0 ||
      state.viewerIndex >= items.length
    ) {
      openViewerItemByIndex(0, { suppressLoading: true, smoothSwap: true });
    }
    updateSlideshowButtonState();
    scheduleSlideshowStep();
  }

  function openImageViewerFromGrid(
    viewSrc,
    viewName,
    alt,
    downloadSrc,
    downloadName,
    thumbSrc,
  ) {
    state.slideshowPlaying = false;
    setSlideshowMode(false);
    state.viewerSidebarHidden = false;
    updateViewerSidebarState();
    state.viewerItems = buildViewerItems();
    let index = state.viewerItems.findIndex(function (item) {
      return item.viewSrc === viewSrc && item.downloadSrc === downloadSrc;
    });
    if (index < 0) {
      index = state.viewerItems.findIndex(function (item) {
        return item.viewSrc === viewSrc;
      });
    }
    if (index < 0) {
      state.viewerItems = [
        {
          viewSrc: viewSrc,
          viewName: viewName,
          alt: alt,
          thumbSrc: thumbSrc || viewSrc,
          thumbAlt: viewName || alt,
          downloadSrc: downloadSrc,
          downloadName: downloadName,
        },
      ];
      index = 0;
    }
    renderViewerThumbList();
    openViewerItemByIndex(index);
  }

  function closeImageViewer() {
    stopSlideshow();
    $imageViewer.addClass("is-hidden").attr("aria-hidden", "true");
    $("body").removeClass("is-viewer-open");
    $imageViewerImg.attr("src", "");
    $imageViewerImg.off("load.viewerload error.viewerload");
    $imageViewerLoading.addClass("is-hidden");
    $imageViewerDownload.attr("href", "#");
    $imageViewerDownload.attr("download", "");
    setViewerZoom(1);
    setViewerRotation(0);
    stopViewerDrag();
    state.viewerItems = [];
    state.viewerIndex = -1;
    state.viewerSidebarHidden = false;
    updateViewerSidebarState();
    $imageViewerThumbList.empty();
    updateViewerNavButtons();
  }

  function applyViewerTransform() {
    $imageViewerImg.css(
      "transform",
      "translate(-50%, -50%) translate(" +
        state.viewerPanX.toFixed(1) +
        "px, " +
        state.viewerPanY.toFixed(1) +
        "px) scale(" +
        state.viewerZoom.toFixed(2) +
        ") rotate(" +
        state.viewerRotation +
        "deg)",
    );
  }

  function stopViewerDrag() {
    state.viewerDragging = false;
    $imageViewerCanvas.removeClass("is-dragging");
  }

  function getViewerPointerPoint(event) {
    const nativeEvent =
      event && event.originalEvent ? event.originalEvent : event;
    if (!nativeEvent) {
      return null;
    }
    if (nativeEvent.touches && nativeEvent.touches.length) {
      return {
        x: nativeEvent.touches[0].clientX,
        y: nativeEvent.touches[0].clientY,
      };
    }
    if (nativeEvent.changedTouches && nativeEvent.changedTouches.length) {
      return {
        x: nativeEvent.changedTouches[0].clientX,
        y: nativeEvent.changedTouches[0].clientY,
      };
    }
    if (
      typeof nativeEvent.clientX === "number" &&
      typeof nativeEvent.clientY === "number"
    ) {
      return {
        x: nativeEvent.clientX,
        y: nativeEvent.clientY,
      };
    }
    return null;
  }

  function startViewerDrag(event) {
    if (state.viewerZoom <= 1) {
      return;
    }
    const point = getViewerPointerPoint(event);
    if (!point) {
      return;
    }
    state.viewerDragging = true;
    state.viewerDragStartX = point.x;
    state.viewerDragStartY = point.y;
    state.viewerDragOriginX = state.viewerPanX;
    state.viewerDragOriginY = state.viewerPanY;
    $imageViewerCanvas.addClass("is-dragging");
  }

  function updateViewerDragPosition(event) {
    if (!state.viewerDragging) {
      return;
    }
    const point = getViewerPointerPoint(event);
    if (!point) {
      return;
    }
    const dx = point.x - state.viewerDragStartX;
    const dy = point.y - state.viewerDragStartY;
    state.viewerPanX = state.viewerDragOriginX + dx;
    state.viewerPanY = state.viewerDragOriginY + dy;
    applyViewerTransform();
  }

  function setViewerZoom(value) {
    const clamped = Math.max(0.5, Math.min(4, Number(value) || 1));
    state.viewerZoom = clamped;
    if (clamped <= 1) {
      state.viewerPanX = 0;
      state.viewerPanY = 0;
    }
    applyViewerTransform();
    $imageViewerZoomOut.prop("disabled", clamped <= 0.5);
    $imageViewerZoomIn.prop("disabled", clamped >= 4);
    $imageViewerZoomReset.text(clamped.toFixed(1) + "x");
    $imageViewerCanvas.toggleClass("is-draggable", clamped > 1);
    if (clamped <= 1) {
      stopViewerDrag();
    }
  }

  function setViewerRotation(value) {
    state.viewerRotation = Number(value) || 0;
    applyViewerTransform();
  }

  function bindImageViewerEvents() {
    $albumSortToggle.on("click", function (event) {
      event.stopPropagation();
      const nextOpen = $albumSortMenu.hasClass("is-hidden");
      if (nextOpen) {
        renderSortMenu();
        $albumSortMenu.removeClass("is-hidden").attr("aria-hidden", "false");
        $albumSortToggle.addClass("is-open");
      } else {
        closeSortMenu();
      }
    });

    $albumSortMenu.on("click", ".album-sort-option", function (event) {
      event.stopPropagation();
      const nextMode = getNormalizedSortMode($(this).attr("data-sort-mode"));
      if (nextMode !== state.sortMode) {
        state.sortMode = nextMode;
        localStorage.setItem("album-viewer-sort-mode", state.sortMode);
        renderSortMenu();
        renderActiveAlbum();
      }
      closeSortMenu();
    });

    $albumSlideshowToggle.on("click", function () {
      if (state.slideshowPlaying) {
        stopSlideshow();
        return;
      }
      startSlideshow();
    });

    $scrollTop.on("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    $(window).on("scroll", updateScrollTopVisibility);

    $imageViewerSlideshowToggle.on("click", function () {
      if (!state.slideshowMode) {
        return;
      }
      if (state.slideshowPlaying) {
        pauseSlideshow();
        return;
      }
      resumeSlideshow();
    });

    $imageViewerAudioToggle.on("click", function () {
      if (!state.slideshowMode) {
        return;
      }
      if (!state.slideshowAudioList.length) {
        ensureSlideshowAudioList({ showEmpty: true, autoplay: true });
        return;
      }
      toggleSlideshowAudioMute();
    });

    $imageViewerAudioToggle.on("dblclick", function (event) {
      event.preventDefault();
    });

    $imageViewerAudioRange.on("input change", function () {
      const step = Number($(this).val() || 0);
      const value = Math.max(0, Math.min(1, step / 4));
      setSlideshowAudioVolume(value);
      if (value > 0 && state.slideshowMode && state.slideshowPlaying) {
        if (slideshowAudio.paused) {
          playSlideshowAudio();
        }
      }
    });

    if ($imageViewerAudioWrap.length) {
      $imageViewerAudioWrap.on("mouseenter", function () {
        if (!state.slideshowMode) {
          return;
        }
        $imageViewerAudioPopover
          .removeClass("is-hidden")
          .addClass("is-open")
          .attr("aria-hidden", "false");
      });

      $imageViewerAudioWrap.on("mouseleave", function () {
        $imageViewerAudioPopover
          .addClass("is-hidden")
          .removeClass("is-open")
          .attr("aria-hidden", "true");
      });
    }

    $imageGrid.on(
      "click touchstart touchend",
      ".thumb-download",
      function (event) {
        event.stopPropagation();
      },
    );

    $imageViewerDownload.on("click touchstart touchend", function (event) {
      event.stopPropagation();
    });

    $imageGrid.on("click", ".thumb-delete", function (event) {
      event.preventDefault();
      event.stopPropagation();
      const isAdmin = String(state.authRole || "").toLowerCase() === "admin";
      if (!state.authUser || !isAdmin) {
        return;
      }
      const $btn = $(this);
      const $card = $btn.closest(".image-card");
      const folder =
        $btn.attr("data-folder") || $card.attr("data-folder") || "";
      const file =
        $btn.attr("data-file") || $card.attr("data-original-name") || "";
      if (!folder || !file) {
        return;
      }
      const msg = t("image_delete_confirm", { file: file });
      openConfirmModal(msg).then(function (confirmed) {
        if (!confirmed) {
          return;
        }
        $.ajax({
          url: buildApiUrl("__delete_image__"),
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify({ folder: folder, file: file }),
          dataType: "json",
        })
          .done(function (response) {
            if (response && response.ok) {
              showResultModal(t("image_delete_success"), "success");
              const currentAlbum = state.albums[state.activeIndex] || {};
              const preferred =
                currentAlbum && !currentAlbum.isAll ? currentAlbum.folder : "";
              loadAlbums(preferred).catch(function () {});
            } else {
              showResultModal(
                (response && response.message) || t("image_delete_fail"),
                "error",
              );
            }
          })
          .fail(function (xhr) {
            const payload = xhr && xhr.responseJSON;
            showResultModal(
              (payload && payload.message) || t("image_delete_fail"),
              "error",
            );
          });
      });
    });

    $imageGrid.on("click", ".image-card img", function () {
      if (state.editingPage) {
        return;
      }
      flashEvent($(this), "thumb-event-flash");
      const viewSrc =
        $(this).attr("data-view-src") ||
        $(this).attr("src") ||
        $(this).attr("data-src") ||
        "";
      const downloadSrc = $(this).attr("data-original-src") || viewSrc;
      const alt = $(this).attr("alt") || "";
      const thumbSrc =
        $(this).attr("src") || $(this).attr("data-src") || viewSrc;
      const viewName =
        $(this).attr("data-view-name") ||
        $(this).closest(".image-card").find(".caption").text();
      const downloadName = $(this).attr("data-original-name") || viewName;
      openImageViewerFromGrid(
        viewSrc,
        viewName,
        alt,
        downloadSrc,
        downloadName,
        thumbSrc,
      );
    });

    $imageViewerClose.on("click", function () {
      flashEvent($imageViewerClose);
      closeImageViewer();
    });

    $imageViewerZoomIn.on("click", function () {
      setViewerZoom(state.viewerZoom + 0.2);
    });

    $imageViewerZoomOut.on("click", function () {
      setViewerZoom(state.viewerZoom - 0.2);
    });

    $imageViewerZoomReset.on("click", function () {
      setViewerZoom(1);
    });

    $imageViewerPrev.on("click", function () {
      openViewerItemByIndex(
        state.viewerIndex - 1,
        state.slideshowMode
          ? { suppressLoading: true, smoothSwap: true }
          : undefined,
      );
      if (state.slideshowPlaying) {
        scheduleSlideshowStep();
      }
    });

    $imageViewerNext.on("click", function () {
      openViewerItemByIndex(
        state.viewerIndex + 1,
        state.slideshowMode
          ? { suppressLoading: true, smoothSwap: true }
          : undefined,
      );
      if (state.slideshowPlaying) {
        scheduleSlideshowStep();
      }
    });

    $imageViewerStagePrev.on("click", function () {
      openViewerItemByIndex(
        state.viewerIndex - 1,
        state.slideshowMode
          ? { suppressLoading: true, smoothSwap: true }
          : undefined,
      );
      if (state.slideshowPlaying) {
        scheduleSlideshowStep();
      }
    });

    $imageViewerStageNext.on("click", function () {
      openViewerItemByIndex(
        state.viewerIndex + 1,
        state.slideshowMode
          ? { suppressLoading: true, smoothSwap: true }
          : undefined,
      );
      if (state.slideshowPlaying) {
        scheduleSlideshowStep();
      }
    });

    $imageViewer.on("click", ".image-viewer-stage", function (event) {
      if (!state.slideshowMode || !mobileMedia.matches) {
        return;
      }
      if (
        $(event.target).closest(
          "button, a, .image-viewer-slideshow-head, .image-viewer-right-top",
        ).length
      ) {
        return;
      }
      state.slideshowControlsVisible = !state.slideshowControlsVisible;
      applySlideshowControlsVisibility();
    });

    $imageViewerSidebarToggle.on("click", function () {
      state.viewerSidebarHidden = !state.viewerSidebarHidden;
      updateViewerSidebarState();
    });

    $imageViewerRotateLeft.on("click", function () {
      setViewerRotation(state.viewerRotation - 90);
    });

    $imageViewerRotateRight.on("click", function () {
      setViewerRotation(state.viewerRotation + 90);
    });

    $imageViewerCanvas.on("wheel", function (event) {
      if ($imageViewer.hasClass("is-hidden")) {
        return;
      }
      if (state.slideshowMode) {
        return;
      }
      event.preventDefault();
      const nativeEvent = event.originalEvent;
      const delta =
        nativeEvent && typeof nativeEvent.deltaY === "number"
          ? nativeEvent.deltaY
          : 0;
      const step = delta > 0 ? -0.1 : 0.1;
      setViewerZoom(state.viewerZoom + step);
    });

    $imageViewerCanvas.on("mousedown", function (event) {
      if (state.slideshowMode) {
        return;
      }
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      startViewerDrag(event);
    });

    $imageViewerCanvas.on("touchstart", function (event) {
      if (state.slideshowMode) {
        return;
      }
      if (state.viewerZoom <= 1) {
        return;
      }
      event.preventDefault();
      startViewerDrag(event);
    });

    $(document).on("mousemove", function (event) {
      updateViewerDragPosition(event);
    });

    $(document).on("touchmove", function (event) {
      if (!state.viewerDragging) {
        return;
      }
      event.preventDefault();
      updateViewerDragPosition(event);
    });

    $(document).on("mouseup", function () {
      stopViewerDrag();
    });

    $(document).on("touchend touchcancel", function () {
      stopViewerDrag();
    });

    $imageViewer.on("click", function (event) {
      if (event.target === this) {
        closeImageViewer();
      }
    });

    $(document).on("keydown", function (event) {
      if (event.key === "Escape" && !$imageViewer.hasClass("is-hidden")) {
        closeImageViewer();
        return;
      }
      if ($imageViewer.hasClass("is-hidden")) {
        return;
      }
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        openViewerItemByIndex(
          state.viewerIndex - 1,
          state.slideshowMode
            ? { suppressLoading: true, smoothSwap: true }
            : undefined,
        );
      }
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        openViewerItemByIndex(
          state.viewerIndex + 1,
          state.slideshowMode
            ? { suppressLoading: true, smoothSwap: true }
            : undefined,
        );
      }
    });

    $(document).on("click", function (event) {
      if (
        $(event.target).closest(".album-actions-toggle, .album-actions-menu")
          .length
      ) {
        return;
      }
      if ($(event.target).closest(".album-sort-control").length) {
        return;
      }
      $(".album-actions-menu.is-open")
        .removeClass("is-open")
        .attr("aria-hidden", "true");
      $(".album-actions-toggle.is-open").removeClass("is-open");
      closeSortMenu();
    });
  }

  function bindProgressiveLoadEvents() {
    $(window).on("scroll resize", function () {
      if (state.scrollTicking) {
        return;
      }
      state.scrollTicking = true;
      window.requestAnimationFrame(function () {
        state.scrollTicking = false;
        maybeLoadMoreByScroll();
      });
    });
    $(window).on("resize", function () {
      if ($imageViewer.hasClass("is-hidden")) {
        return;
      }
      applySlideshowControlsVisibility();
      updateViewerCaption(state.viewerCaptionRaw);
    });
  }

  function loadLanguages() {
    return $.getJSON("/resources/album-resource/lang.json").then(
      function (json) {
        state.dict = json || fallbackDict;
        if (!state.dict[state.lang]) {
          state.lang = defaultLang;
        }
      },
    );
  }

  function normalizeColorPacks(json) {
    if (!Array.isArray(json)) {
      return null;
    }
    const unique = {};
    const parsed = json
      .map(function (item) {
        if (!item || typeof item !== "object") {
          return null;
        }
        const value = String(item.value || "").trim();
        const text =
          item.text && typeof item.text === "object" ? item.text : {};
        const colorsObj =
          item.colors && typeof item.colors === "object" ? item.colors : {};
        const lightColors = Array.isArray(colorsObj.light)
          ? colorsObj.light
          : [];
        const darkColors = Array.isArray(colorsObj.dark) ? colorsObj.dark : [];
        if (!value || unique[value]) {
          return null;
        }
        const normalizedLight = lightColors
          .map(function (hex) {
            return String(hex || "").trim();
          })
          .filter(function (hex) {
            return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex);
          })
          .slice(0, 5);
        const normalizedDark = darkColors
          .map(function (hex) {
            return String(hex || "").trim();
          })
          .filter(function (hex) {
            return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex);
          })
          .slice(0, 5);
        if (normalizedLight.length !== 5 || normalizedDark.length !== 5) {
          return null;
        }
        unique[value] = true;
        return {
          value: value,
          text: {
            vi: String(text.vi || text.en || value),
            en: String(text.en || text.vi || value),
          },
          colors: {
            light: normalizedLight,
            dark: normalizedDark,
          },
        };
      })
      .filter(Boolean);
    return parsed.length ? parsed : null;
  }

  function loadColorPacks() {
    return $.getJSON("/resources/album-resource/color-packs.json").then(
      function (json) {
        const packs = normalizeColorPacks(json) || defaultColorPacks;
        state.colorPacks = packs;
        ensureValidColorPack();
        applyColorPack();
      },
      function () {
        state.colorPacks = defaultColorPacks;
        ensureValidColorPack();
        applyColorPack();
      },
    );
  }

  function loadAlbums(preferredFolder) {
    return $.getJSON(albumsApiPath)
      .then(function (data) {
        const albums = Array.isArray(data && data.albums) ? data.albums : [];
        const allImages = [];
        albums.forEach(function (album) {
          if (album && !album.isAll) {
            album.hidden = !!album.hidden;
            album.hiddenOriginal = album.hidden;
          }
          const folder = album.folder || "";
          (Array.isArray(album.images) ? album.images : []).forEach(
            function (entry) {
              if (entry && typeof entry === "object") {
                entry.hidden = !!entry.hidden;
              }
              const normalized = normalizeImageEntry(entry);
              allImages.push({
                folder: folder,
                name: normalized.name,
                root: normalized.root,
                detail: normalized.detail,
                detail_root: normalized.detailRoot,
                original: normalized.original,
                original_root: normalized.originalRoot,
                uploaded_at: normalized.uploadedAt,
                created_at: normalized.createdAt,
                hidden: !!(entry && entry.hidden),
              });
            },
          );
        });
        const allAlbum = {
          isAll: true,
          title: "",
          folder: "",
          images: allImages,
        };
        state.hasError = false;
        state.albums = [allAlbum].concat(albums);
        state.hiddenImageBase = buildHiddenImageBase(state.albums);
        state.hiddenImageCurrent = cloneHiddenImageMap(state.hiddenImageBase);
        if (
          state.albumTitleOverrides &&
          typeof state.albumTitleOverrides === "object"
        ) {
          state.albums.forEach(function (item) {
            if (!item || item.isAll) {
              return;
            }
            const folderKey = String(item.folder || "");
            if (
              !folderKey ||
              !Object.prototype.hasOwnProperty.call(
                state.albumTitleOverrides,
                folderKey,
              )
            ) {
              return;
            }
            const overrideTitle = String(
              state.albumTitleOverrides[folderKey] || "",
            );
            if (overrideTitle && String(item.title || "") === overrideTitle) {
              delete state.albumTitleOverrides[folderKey];
            }
          });
        }
        const preferred = String(preferredFolder || "").trim();
        if (preferred) {
          const nextIndex = state.albums.findIndex(function (item) {
            return !item.isAll && String(item.folder || "") === preferred;
          });
          state.activeIndex = nextIndex > -1 ? nextIndex : 0;
        } else {
          state.activeIndex = 0;
        }
        renderAlbumList();
      })
      .catch(function (xhr) {
        state.hasError = true;
        renderError();
        if (xhr && xhr.status) {
          $.ajax({
            url: buildApiUrl("__client_error__"),
            method: "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({
              code: xhr.status,
              route: "__albums__",
              detail: String(xhr.statusText || ""),
            }),
          });
        }
        throw xhr;
      });
  }

  function getScrollCardStatusClass(status) {
    return "is-" + (status || "closed");
  }

  function setScrollCardStatus(status) {
    state.scrollCard.status = status;
    $scrollCardRoute
      .removeClass("is-closed is-opening is-opened")
      .addClass(getScrollCardStatusClass(status));
  }

  function triggerScrollCardBurst() {
    $scrollCardRoute.removeClass("is-bursting");
    window.requestAnimationFrame(function () {
      $scrollCardRoute.addClass("is-bursting");
      window.setTimeout(function () {
        $scrollCardRoute.removeClass("is-bursting");
      }, 1500);
    });
  }

  function setScrollCardMusicButton() {
    const label = state.scrollCard.musicPlaying
      ? "Tắt nhạc"
      : state.scrollCard.autoplayBlocked
        ? "Bật nhạc"
        : "Bật nhạc";
    $scrollCardMusic
      .toggleClass("is-playing", state.scrollCard.musicPlaying)
      .toggleClass("is-hidden", false)
      .find(".scroll-card-music-text")
      .text(label);
  }

  function stopScrollCardMusic() {
    if (!scrollCardAudio) {
      return;
    }
    scrollCardAudio.pause();
    state.scrollCard.musicPlaying = false;
    setScrollCardMusicButton();
  }

  function playScrollCardMusic() {
    if (!scrollCardAudio || !state.scrollCard.musicReady) {
      return;
    }
    scrollCardAudio.loop = true;
    scrollCardAudio.volume = 0.72;
    scrollCardAudio
      .play()
      .then(function () {
        state.scrollCard.autoplayBlocked = false;
        state.scrollCard.musicPlaying = true;
        setScrollCardMusicButton();
      })
      .catch(function () {
        state.scrollCard.autoplayBlocked = true;
        state.scrollCard.musicPlaying = false;
        setScrollCardMusicButton();
      });
  }

  function toggleScrollCardMusic() {
    if (!scrollCardAudio || !state.scrollCard.musicReady) {
      return;
    }
    if (state.scrollCard.musicPlaying) {
      stopScrollCardMusic();
      return;
    }
    playScrollCardMusic();
  }

  function renderScrollCardGallery(images) {
    const list = Array.isArray(images) ? images.slice(0, 4) : [];
    if (!list.length) {
      $scrollCardGallery.html(
        '<div class="scroll-card-photo-placeholder">' +
          '<span>♡</span><strong>Khoảnh khắc kỷ niệm</strong>' +
          "<em>Ảnh sẽ hiện ở đây khi album có dữ liệu</em>" +
          "</div>",
      );
      return;
    }
    $scrollCardGallery.html(
      list
        .map(function (item, index) {
          return (
            '<figure class="scroll-card-photo">' +
            '<img src="' +
            escapeHtml(item.src) +
            '" alt="' +
            escapeHtml(item.alt || "Ảnh kỷ niệm " + (index + 1)) +
            '" loading="lazy" decoding="async" />' +
            "</figure>"
          );
        })
        .join(""),
    );
  }

  function loadScrollCardImages() {
    return $.getJSON(albumsApiPath)
      .then(function (data) {
        const albums = Array.isArray(data && data.albums) ? data.albums : [];
        const images = [];
        albums.some(function (album) {
          if (!album || album.hidden || album.isAll) {
            return false;
          }
          const folder = String(album.folder || "");
          const entries = Array.isArray(album.images) ? album.images : [];
          entries.some(function (entry) {
            if (!entry || entry.hidden || images.length >= 4) {
              return images.length >= 4;
            }
            const info = resolveImageInfo(folder, entry);
            images.push({
              src: info.detailPath || info.imagePath || info.originalPath,
              alt: toCaptionBaseName(info.originalName || info.fileName),
            });
            return images.length >= 4;
          });
          return images.length >= 4;
        });
        state.scrollCard.images = images;
        renderScrollCardGallery(images);
      })
      .catch(function () {
        renderScrollCardGallery([]);
      });
  }

  function loadScrollCardContent() {
    const params = state.scrollCard.invitationCode
      ? { data: state.scrollCard.invitationCode }
      : undefined;
    return $.getJSON(buildApiUrl("__invitation_card__", params))
      .then(function (data) {
        const greetContent =
          data && typeof data.greet_content === "string"
            ? data.greet_content.trim()
            : "";
        if (greetContent && !state.scrollCard.messageFromQuery) {
          state.scrollCard.message = greetContent;
        }
        if (data && typeof data.bride_name === "string") {
          state.scrollCard.brideName = data.bride_name.trim();
        }
        if (data && typeof data.groom_name === "string") {
          state.scrollCard.groomName = data.groom_name.trim();
        }
        if (data && typeof data.bride_father === "string") {
          state.scrollCard.brideFather = data.bride_father.trim();
        }
        if (data && typeof data.bride_mother === "string") {
          state.scrollCard.brideMother = data.bride_mother.trim();
        }
        if (data && typeof data.bride_family_address === "string") {
          state.scrollCard.brideFamilyAddress =
            data.bride_family_address.trim();
        }
        if (data && typeof data.groom_father === "string") {
          state.scrollCard.groomFather = data.groom_father.trim();
        }
        if (data && typeof data.groom_mother === "string") {
          state.scrollCard.groomMother = data.groom_mother.trim();
        }
        if (data && typeof data.groom_family_address === "string") {
          state.scrollCard.groomFamilyAddress =
            data.groom_family_address.trim();
        }
        if (data && typeof data.event_date === "string") {
          state.scrollCard.eventDate = data.event_date.trim();
        }
        if (
          data &&
          typeof data.event_time === "string" &&
          !state.scrollCard.eventTimeFromQuery
        ) {
          state.scrollCard.eventTime = data.event_time.trim();
        }
        if (data && typeof data.lunar_date === "string") {
          state.scrollCard.lunarDate = data.lunar_date.trim();
        }
        if (data && typeof data.guest_time === "string") {
          state.scrollCard.guestTime = data.guest_time.trim();
        }
        if (data && typeof data.party_time === "string") {
          state.scrollCard.partyTime = data.party_time.trim();
        }
        if (
          data &&
          typeof data.ceremony_location === "string" &&
          !state.scrollCard.eventLocationFromQuery
        ) {
          state.scrollCard.ceremonyLocation = data.ceremony_location.trim();
        }
        if (
          data &&
          typeof data.party_location === "string" &&
          !state.scrollCard.eventLocationFromQuery
        ) {
          state.scrollCard.partyLocation = data.party_location.trim();
        }
        if (
          data &&
          typeof data.event_location === "string" &&
          !state.scrollCard.eventLocationFromQuery
        ) {
          state.scrollCard.partyLocation = data.event_location.trim();
        }
        if (data && typeof data.map_query === "string") {
          state.scrollCard.mapQuery = data.map_query.trim();
        }
        if (data && typeof data.guestbook_visible === "boolean") {
          state.scrollCard.guestbookVisible = data.guestbook_visible;
        }
        renderScrollCardTexts();
      })
      .catch(function () {});
  }

  function loadScrollCardMusic() {
    const configuredMusic = state.scrollCard.musicUrl;
    if (configuredMusic) {
      if (scrollCardAudio) {
        scrollCardAudio.src = configuredMusic;
        scrollCardAudio.loop = true;
        state.scrollCard.musicReady = true;
      }
      setScrollCardMusicButton();
      return $.Deferred().resolve().promise();
    }
    return $.getJSON(buildApiUrl("__list_audio_public__"))
      .then(function (response) {
        const files =
          response && response.ok && Array.isArray(response.files)
            ? response.files
            : [];
        if (files.length && scrollCardAudio) {
          const randomIndex = Math.floor(Math.random() * files.length);
          scrollCardAudio.src = getSlideshowAudioSrc(files[randomIndex]);
          scrollCardAudio.loop = true;
          state.scrollCard.musicReady = true;
        }
        setScrollCardMusicButton();
      })
      .catch(function () {
        state.scrollCard.musicReady = false;
        setScrollCardMusicButton();
      });
  }

  function parseWeddingDateParts(eventDate) {
    const raw = String(eventDate || "");
    const numbers = raw.match(/\d+/g) || [];
    return {
      day: numbers[0] ? Number(numbers[0]) : 3,
      month: numbers[1] ? Number(numbers[1]) : 5,
      year: numbers[2] ? Number(numbers[2]) : 2026,
    };
  }

  function renderWeddingCalendar(eventDate) {
    const parts = parseWeddingDateParts(eventDate);
    const month = Math.min(Math.max(parts.month, 1), 12);
    const year = parts.year || 2026;
    const weddingDay = Math.min(Math.max(parts.day, 1), 31);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const mondayOffset = (firstDay + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells = [];
    for (let index = 0; index < mondayOffset; index += 1) {
      cells.push("<span></span>");
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(
        '<span class="' +
          (day === weddingDay ? "is-wedding-day" : "") +
          '">' +
          day +
          "</span>",
      );
    }
    $weddingCalendarTitle.text("Tháng " + month + " / " + year);
    $weddingCalendarDays.html(cells.join(""));
  }

  function getDisplayLastTwoWords(name) {
    const words = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return words.slice(-2).join(" ") || String(name || "").trim();
  }

  function formatScrollCardGreeting(message, recipient) {
    const title = String(state.scrollCard.recipientTitle || "").trim();
    const name = String(state.scrollCard.recipientName || "").trim();
    return String(message || "")
      .replace(/\[title\]/gi, title)
      .replace(/\[name\]/gi, name || recipient)
      .replace(/\s+/g, " ")
      .trim();
  }

  function renderScrollCardTexts() {
    const recipient =
      state.scrollCard.recipientDisplayName ||
      [state.scrollCard.recipientTitle, state.scrollCard.recipientName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      "bạn";
    const coverRecipient = [
      String(state.scrollCard.recipientPrefix || "").trim(),
      recipient,
      String(state.scrollCard.recipientSuffix || "").trim(),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    const brideName = state.scrollCard.brideName || "Ngọc Ánh";
    const groomName = state.scrollCard.groomName || "Thế Bảo";
    const brideDisplayName = getDisplayLastTwoWords(brideName);
    const groomDisplayName = getDisplayLastTwoWords(groomName);
    const eventDate = state.scrollCard.eventDate || "";
    $scrollCardTitle.html(
      escapeHtml(brideName) + "<br />&amp;<br />" + escapeHtml(groomName),
    );
    $scrollCardRecipient.text("Thân gửi " + recipient + ",");
    $scrollCardMessage.text(
      formatScrollCardGreeting(state.scrollCard.message, recipient),
    );
    $weddingCoverNameA.text(brideDisplayName);
    $weddingCoverNameB.text(groomDisplayName);
    $weddingCoverDate.text(eventDate);
    $weddingCoverGuest.text(coverRecipient || recipient);
    $weddingDetailNameA.text(brideDisplayName.toUpperCase());
    $weddingDetailNameB.text(groomDisplayName.toUpperCase());
    $weddingBrideFather.text(state.scrollCard.brideFather || "");
    $weddingBrideMother.text(state.scrollCard.brideMother || "");
    $weddingBrideAddress.text(state.scrollCard.brideFamilyAddress || "");
    $weddingGroomFather.text(state.scrollCard.groomFather || "");
    $weddingGroomMother.text(state.scrollCard.groomMother || "");
    $weddingGroomAddress.text(state.scrollCard.groomFamilyAddress || "");
    $weddingPartyLocation.text(state.scrollCard.partyLocation || "");
    const dayMatch = eventDate.match(/\b(\d{1,2})\b/);
    $weddingDetailDay.text(dayMatch ? dayMatch[1].padStart(2, "0") : "03");
    $weddingLunarDate.text(state.scrollCard.lunarDate || "");
    $weddingGuestTime.text(state.scrollCard.guestTime || "17:30");
    $weddingPartyTime.text(
      state.scrollCard.partyTime ||
        (state.scrollCard.eventTime || "").split(",")[0] ||
        "18:00",
    );
    renderWeddingCalendar(eventDate);
    $weddingMapFrame.attr(
      "src",
      "https://www.google.com/maps?q=" +
        encodeURIComponent(
          state.scrollCard.mapQuery ||
            state.scrollCard.partyLocation ||
            "White Palace Hoàng Văn Thụ",
        ) +
        "&output=embed",
    );
    $scrollCardEventTime.text(state.scrollCard.eventTime || "");
    $scrollCardCeremonyLocation.text(
      state.scrollCard.ceremonyLocation
        ? "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI " +
            state.scrollCard.ceremonyLocation.toUpperCase()
        : "",
    );
    $scrollCardEventTime.toggleClass("is-hidden", !state.scrollCard.eventTime);
    $scrollCardCeremonyLocation.toggleClass(
      "is-hidden",
      !state.scrollCard.ceremonyLocation,
    );
    $scrollCardEvent.toggleClass(
      "is-hidden",
      !state.scrollCard.eventTime && !state.scrollCard.ceremonyLocation,
    );
    $scrollCardSender.text("— " + (state.scrollCard.senderName || "Yêu thương"));
    $weddingGuestbookName
      .val(recipient)
      .attr("readonly", true)
      .attr("aria-label", "Tên người gửi: " + recipient);
    document.title = "Thiệp gửi " + recipient;
  }

  function formatGuestbookDate(value) {
    const raw = String(value || "").trim();
    const match = raw.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/,
    );
    if (!match) {
      return raw;
    }
    return (
      match[4] +
      ":" +
      match[5] +
      (match[6] ? ":" + match[6] : "") +
      " " +
      match[3] +
      "/" +
      match[2] +
      "/" +
      match[1]
    );
  }

  function renderWeddingGuestbook(entries) {
    const list = Array.isArray(entries) ? entries : [];
    if (!list.length) {
      $weddingGuestbookList.html(
        '<p class="wedding-guestbook-empty">Chưa có lời chúc nào.</p>',
      );
      return;
    }
    $weddingGuestbookList.html(
      list
        .map(function (entry) {
          const name = escapeHtml(entry && entry.name ? entry.name : "Khách mời");
          const message = escapeHtml(entry && entry.message ? entry.message : "");
          const createdAt = escapeHtml(formatGuestbookDate(entry && entry.created_at));
          return (
            '<article class="wedding-guestbook-item">' +
            '<header><strong>' +
            name +
            "</strong>" +
            (createdAt ? "<time>" + createdAt + "</time>" : "") +
            "</header>" +
            "<p>" +
            message +
            "</p>" +
            "</article>"
          );
        })
        .join(""),
    );
  }

  function updateWeddingGuestbookVisibility() {
    const visible = !!state.scrollCard.guestbookVisible;
    $weddingGuestbookList.toggleClass("is-hidden", !visible);
    if (!visible) {
      $weddingGuestbookList.empty();
    }
  }

  function loadWeddingGuestbook() {
    updateWeddingGuestbookVisibility();
    if (!state.scrollCard.guestbookVisible) {
      return $.Deferred().resolve().promise();
    }
    if (!state.scrollCard.invitationCode) {
      renderWeddingGuestbook([]);
      return $.Deferred().resolve().promise();
    }
    return $.getJSON(buildApiUrl("__invitation_guestbook__"), {
      data: state.scrollCard.invitationCode,
    })
      .then(function (response) {
        renderWeddingGuestbook(
          response && Array.isArray(response.entries) ? response.entries : [],
        );
      })
      .catch(function () {
        $weddingGuestbookStatus.text("Không tải được sổ lưu bút.");
      });
  }

  function submitWeddingGuestbook() {
    const name = String($weddingGuestbookName.val() || "").trim();
    const message = String($weddingGuestbookMessage.val() || "").trim();
    if (!name || !message) {
      $weddingGuestbookStatus.text("Vui lòng nhập tên và lời chúc.");
      return;
    }
    $weddingGuestbookSubmit.prop("disabled", true);
    $weddingGuestbookStatus.text("Đang gửi lời chúc...");
    $.ajax({
      url: buildApiUrl("__invitation_guestbook__"),
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        code: state.scrollCard.invitationCode,
        name: name,
        message: message,
      }),
    })
      .done(function (response) {
        if (
          response &&
          Object.prototype.hasOwnProperty.call(response, "guestbook_visible")
        ) {
          state.scrollCard.guestbookVisible = !!response.guestbook_visible;
          updateWeddingGuestbookVisibility();
        }
        if (state.scrollCard.guestbookVisible) {
          renderWeddingGuestbook(
            response && Array.isArray(response.entries) ? response.entries : [],
          );
        }
        $weddingGuestbookStatus.text(
          response && response.duplicate
            ? "Lời chúc này đã được lưu trước đó."
            : response && response.updated
              ? "Đã cập nhật lời chúc. Cảm ơn bạn!"
            : "Đã gửi lời chúc. Cảm ơn bạn!",
        );
        if (!(response && response.duplicate)) {
          $weddingGuestbookMessage.val("");
        }
      })
      .fail(function (xhr) {
        const response = xhr && xhr.responseJSON;
        $weddingGuestbookStatus.text(
          response && response.message
            ? response.message
            : "Không gửi được lời chúc.",
        );
      })
      .always(function () {
        $weddingGuestbookSubmit.prop("disabled", false);
      });
  }

  function closeScrollCard() {
    stopScrollCardMusic();
    setScrollCardStatus("closed");
    $scrollCardRoute.attr("aria-hidden", "false");
    resetScrollCardViewport("auto");
  }

  function resetScrollCardViewport(behavior) {
    const scrollBehavior = behavior || "auto";
    const route = $scrollCardRoute.get(0);
    if (route && route.scrollTo) {
      route.scrollTo({ top: 0, left: 0, behavior: scrollBehavior });
    } else if (route) {
      route.scrollTop = 0;
      route.scrollLeft = 0;
    }
    if (window.scrollTo) {
      window.scrollTo({ top: 0, left: 0, behavior: scrollBehavior });
    }
  }

  function openScrollCard() {
    if (state.scrollCard.status !== "closed") {
      return;
    }
    playScrollCardMusic();
    resetScrollCardViewport("auto");
    triggerScrollCardBurst();
    setScrollCardStatus("opening");
    window.setTimeout(function () {
      setScrollCardStatus("opened");
      window.requestAnimationFrame(function () {
        resetScrollCardViewport("auto");
      });
      if (!state.scrollCard.musicPlaying) {
        playScrollCardMusic();
      }
    }, 760);
  }

  function bindScrollCardEvents() {
    $scrollCardClosed.on("click", openScrollCard);
    $scrollCardMusic.on("click", toggleScrollCardMusic);
    $scrollCardWelcome.on("click", closeScrollCard);
    $weddingGuestbookForm.on("submit", function (event) {
      event.preventDefault();
      submitWeddingGuestbook();
    });
    $(document).on("keydown.scrollCard", function (event) {
      if (!state.scrollCard.enabled || event.key !== "Escape") {
        return;
      }
      closeScrollCard();
    });
  }

  function initScrollCardRoute() {
    $("body")
      .removeClass("is-auth-pending is-guest-view is-app-view is-admin-view")
      .addClass("is-scroll-card-view");
    $scrollCardRoute.attr("aria-hidden", "false");
    renderScrollCardTexts();
    renderScrollCardGallery([]);
    setScrollCardStatus("closed");
    resetScrollCardViewport("auto");
    setScrollCardMusicButton();
    bindScrollCardEvents();
    const scrollCardContentRequest = loadScrollCardContent();
    $.when(
      scrollCardContentRequest,
      loadScrollCardImages(),
      loadScrollCardMusic(),
      scrollCardContentRequest.then(function () {
        return loadWeddingGuestbook();
      }),
    ).always(function () {
      setScrollCardMusicButton();
    });
  }

  function loadAuthStatus() {
    return $.getJSON(buildApiUrl("__auth_status__"))
      .then(function (data) {
        const auth = !!(data && data.authenticated);
        const username =
          auth && data && data.username ? String(data.username) : "";
        const role = auth && data && data.role ? String(data.role) : "";
        state.authUser = username;
        state.authRole = role;
        updateAuthUi();
        setViewMode(
          auth ? (state.pageMode === "admin" ? "admin" : "app") : "guest",
        );
        if (
          auth &&
          state.pageMode === "admin" &&
          String(role || "").toLowerCase() === "admin"
        ) {
          state.adminPanel = "requests";
          loadInviteRequests(true);
        }
        return auth;
      })
      .catch(function () {
        state.authUser = "";
        state.authRole = "";
        updateAuthUi();
        setViewMode("guest");
        return false;
      });
  }

  if (state.scrollCard.enabled) {
    applyTheme();
    applyColorPack();
    initScrollCardRoute();
  } else {
    bindSettingsEvents();
    bindGuestInviteForm();
    loadGuestTokenStatus();
    bindAdminNavButton();
    bindInviteRequestsButton();
    bindInvitationLinkButton();
    bindAdminRequestTooltipEvents();
    bindAdminRequestActionEvents();
    bindImageViewerEvents();
    bindProgressiveLoadEvents();
    ensureImageObserver();
    applyTheme();
    applyColorPack();
    applyRadius();
    applySidebarState();
    applyMobileSidebarState();
    updateSearchClearState();
    updateAuthUi();
    renderInitialState();

    if (themeMedia.addEventListener) {
      themeMedia.addEventListener("change", function () {
        if (state.theme === "system") {
          applyTheme();
          applyColorPack();
        }
      });
    }

    if (mobileMedia.addEventListener) {
      mobileMedia.addEventListener("change", function () {
        if (!mobileMedia.matches) {
          state.mobileSidebarOpen = false;
        }
        applySidebarState();
        applyMobileSidebarState();
        if (!$imageViewer.hasClass("is-hidden")) {
          updateViewerCaption(state.viewerCaptionRaw);
        }
      });
    }

    loadLanguages()
      .then(function () {
        return loadColorPacks();
      })
      .then(function () {
        return loadAuthStatus();
      })
      .then(function (isAuth) {
        updateStaticTexts();
        renderInitialState();
        updateScrollTopVisibility();
        if (isAuth) {
          return loadAlbums();
        }
        return null;
      })
      .catch(function () {
        state.dict = fallbackDict;
        if (!state.dict[state.lang]) {
          state.lang = defaultLang;
        }
        state.colorPacks = defaultColorPacks;
        ensureValidColorPack();
        applyColorPack();
        updateStaticTexts();
        setViewMode("guest");
        updateAuthUi();
        updateScrollTopVisibility();
        if (state.authUser) {
          loadAlbums().catch(function () {
            renderError();
          });
        }
      });
  }
})();
