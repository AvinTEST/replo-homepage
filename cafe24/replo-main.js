(function () {
  'use strict';

  document.body.classList.add('replo-c24-page');

  var root = document.querySelector('.replo-c24');
  if (!root) return;

  function pushEvent(name, params) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: name }, params || {}));
  }

  var navToggle = root.querySelector('.replo-nav__toggle');
  var mobileMenu = root.querySelector('#replo-mobile-menu');

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', function () {
      var isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      navToggle.setAttribute('aria-label', isOpen ? '메뉴 열기' : '메뉴 닫기');
      mobileMenu.hidden = isOpen;
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', '메뉴 열기');
        mobileMenu.hidden = true;
      });
    });
  }

  var resultMessages = [
    '항목을 눌러 우리 고객센터를 점검해 보세요.',
    '1개 해당: CS 효율 개선이 필요합니다.',
    '2개 해당: 운영 효율이 낮아지고 있을 가능성이 높습니다.',
    '3개 해당: 인력 충원보다 운영 구조 점검이 먼저 필요한 단계입니다.',
    '4개 해당: 사람의 문제가 아니라 운영 구조 문제일 가능성이 매우 높습니다.',
    '5개 해당: 현재 운영 방식이 이미 한계에 가까운 수준입니다.'
  ];

  var checklist = root.querySelector('[data-checklist]');
  var checkResult = root.querySelector('[data-check-result]');

  if (checklist && checkResult) {
    checklist.querySelectorAll('.replo-check').forEach(function (button) {
      button.addEventListener('click', function () {
        var nextState = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(nextState));
        button.classList.toggle('is-active', nextState);

        var count = checklist.querySelectorAll('.replo-check.is-active').length;
        checkResult.textContent = resultMessages[count];

        pushEvent('replo_diagnosis_update', {
          selected_count: count,
          diagnosis_level: count
        });
      });
    });
  }

  root.querySelectorAll('.replo-plan-card').forEach(function (card) {
    var planName = (card.getAttribute('data-plan-name') || card.querySelector('h3')?.textContent || '').trim();
    var normalizedName = planName.toLowerCase();

    if (normalizedName.indexOf('basic') > -1 || planName.indexOf('베이직') > -1) {
      card.classList.add('is-recommended');
    }

    var link = card.querySelector('.replo-plan-link');
    if (link) {
      link.addEventListener('click', function () {
        pushEvent('select_plan', {
          plan_name: planName,
          product_no: link.getAttribute('data-product-no') || ''
        });
      });
    }
  });

  root.querySelectorAll('[data-track]').forEach(function (element) {
    element.addEventListener('click', function () {
      pushEvent('replo_cta_click', {
        cta_name: element.getAttribute('data-track')
      });
    });
  });

  root.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      var targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;

      var target = root.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      var navHeight = root.querySelector('.replo-nav')?.offsetHeight || 0;
      var top = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
})();
