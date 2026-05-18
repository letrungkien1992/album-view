(function () {
  const dict = {
    vi: {
      login_title: "Đăng nhập",
      login_page_title: "Đăng nhập - Album Viewer",
      login_subtitle: "Đăng nhập để đồng bộ album và quản lý dữ liệu.",
      login_username_label: "Tên đăng nhập",
      login_username_placeholder: "Nhập username",
      login_password_label: "Mật khẩu",
      login_password_placeholder: "Nhập password",
      login_back: "Quay lại",
      login_submit: "Đăng nhập",
      login_missing: "Vui lòng nhập đủ username và password.",
      login_failed: "Đăng nhập thất bại.",
      login_invalid: "Sai thông tin đăng nhập."
    },
    en: {
      login_title: "Login",
      login_page_title: "Login - Album Viewer",
      login_subtitle: "Login to sync albums and manage data.",
      login_username_label: "Username",
      login_username_placeholder: "Enter username",
      login_password_label: "Password",
      login_password_placeholder: "Enter password",
      login_back: "Back",
      login_submit: "Login",
      login_missing: "Please enter username and password.",
      login_failed: "Login failed.",
      login_invalid: "Invalid login credentials."
    }
  };

  function getLang() {
    const raw = localStorage.getItem("album-viewer-lang") || "vi";
    return dict[raw] ? raw : "vi";
  }

  function applyLang() {
    const lang = getLang();
    const texts = dict[lang];
    document.documentElement.setAttribute("lang", lang);
    document.title = texts.login_page_title;
    $("[data-i18n]").each(function () {
      const key = $(this).attr("data-i18n");
      if (key && texts[key]) {
        $(this).text(texts[key]);
      }
    });
    $("[data-i18n-placeholder]").each(function () {
      const key = $(this).attr("data-i18n-placeholder");
      if (key && texts[key]) {
        $(this).attr("placeholder", texts[key]);
      }
    });
  }

  function message(text) {
    $("#login-error").text(text || "");
  }

  function lockForm(locked) {
    $("#login-submit").prop("disabled", locked);
    $("#username, #password").prop("disabled", locked);
  }

  $(function () {
    applyLang();
    $("#login-form").on("submit", function (event) {
      event.preventDefault();
      const username = String($("#username").val() || "").trim();
      const password = String($("#password").val() || "");
      const lang = getLang();
      const texts = dict[lang];

      if (!username || !password) {
        message(texts.login_missing);
        return;
      }

      message("");
      lockForm(true);

      $.ajax({
        url: "__auth_login__",
        method: "POST",
        dataType: "json",
        data: { username: username, password: password }
      })
        .done(function (response) {
          if (response && response.ok) {
            const target = response.redirect || "./";
            window.location.href = target;
            return;
          }
          message((response && response.message) || texts.login_failed);
        })
        .fail(function (xhr) {
          const payload = xhr && xhr.responseJSON;
          message((payload && payload.message) || texts.login_invalid);
        })
        .always(function () {
          lockForm(false);
        });
    });
  });
})();
