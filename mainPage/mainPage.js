document.addEventListener("DOMContentLoaded", function () {
  var mapContainer2 = document.querySelector("#mapContainer2");
  var mapContainer3 = document.querySelector("#mapContainer3");
  var menuBar = document.querySelector("#menuBar");
  var memoSearchBar = document.querySelector("#memoSearchBar");

  var mapContainer = document.querySelector("#map"),
    mapOption = {
      center: new kakao.maps.LatLng(37.55811021038101, 126.925950050354),
      level: 3,
    };

  var map = new kakao.maps.Map(mapContainer, mapOption);
  var ps = new kakao.maps.services.Places();
  var infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });

  var markers = [];
  var markerData = JSON.parse(localStorage.getItem("markerData")) || {};
  var starGradeData = [];

  // 마지막으로 생성된 마커 추적
  var lastMarker = null;

  // 고유 ID 생성기
  function generateUniqueId() {
    return "_" + Math.random().toString(36).substr(2, 9);
  }

  // @@마커 데이터 로드&추가
  // 마커 데이터가 있으면 지도에 마커를 추가
  Object.keys(markerData).forEach((markerId) => {
    var data = markerData[markerId];
    var markerPosition = new kakao.maps.LatLng(data.lat, data.lng);
    var marker = new kakao.maps.Marker({
      position: markerPosition,
    });
    marker.setMap(map);
    markers.push({ id: markerId, marker: marker });

    kakao.maps.event.addListener(marker, "click", function () {
      var iwContent =
        '<div class="info-content">' +
        '<div class="info-row">' +
        "<p>카페명:</p>" +
        data.name +
        "</div>" +
        '<div class="info-row">' +
        "<p>메뉴:</p>" +
        data.snack +
        "</div>" +
        '<div class="info-row">' +
        "<p>가격:</p>" +
        data.price +
        "</div>" +
        '<div class="info-row">' +
        "<p>별점:</p>" +
        data.starGradeData +
        "</div>" +
        '<div class="info-row textarea-row">' +
        "<p>설명:</p>" +
        data.description +
        "</div>" +
        '<button class="infoBtn modifyBtn" onclick="editContent(\'' +
        markerId +
        "')\">수정</button>" +
        '<button class="infoBtn deleteBtn" onclick="deleteContent(\'' +
        markerId +
        "')\">삭제</button>" +
        "</div>";
      infowindow.setContent(iwContent);
      infowindow.open(map, marker);
    });
  });

  // @@장소 검색 기능
  function searchPlaces() {
    var keyword = document.getElementById("searchPlaceBar")?.value;

    if (!keyword?.trim()) {
      alert("키워드를 입력해주세요!");
      return false;
    }

    ps.keywordSearch(keyword, placesSearchCB);
  }

  function placesSearchCB(data, status, pagination) {
    if (status === kakao.maps.services.Status.OK) {
      var bounds = new kakao.maps.LatLngBounds();

      for (var i = 0; i < data.length; i++) {
        bounds.extend(new kakao.maps.LatLng(data[i].y, data[i].x));
      }

      map.setBounds(bounds);
    }
  }

  document
    .getElementById("searchPlaceBtn")
    ?.addEventListener("click", function () {
      searchPlaces();
    });

  document
    .getElementById("searchPlaceBar")
    ?.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        searchPlaces();
      }
    });

  // @@마커생성, 인포윈도우
  // 마커 최초 생성
  kakao.maps.event.addListener(map, "click", function (mouseEvent) {
    // 아무 글자도 입력되지 않았으면 삭제
    if (
      lastMarker &&
      !document.getElementById("name")?.value &&
      !document.getElementById("snack")?.value &&
      !document.getElementById("price")?.value &&
      !document.getElementById("starGrade")?.value &&
      !document.getElementById("description")?.value
    ) {
      var markerIndex = markers.findIndex(
        (marker) => marker.marker === lastMarker
      );
      lastMarker.setMap(null);
      markers.splice(markerIndex, 1);
      delete markerData[lastMarker.markerId];
      lastMarker = null;
      infowindow.close();
      return;
    }

    var latlng = mouseEvent.latLng;
    var markerId = generateUniqueId();

    var marker = new kakao.maps.Marker({
      position: latlng,
    });

    marker.setMap(map);
    marker.markerId = markerId;
    markers.push({ id: markerId, marker: marker });
    lastMarker = marker;

    var iwContent = `<div class="info-content"> 
      <div class="info-row"> 
      <label>카페명:</label>
      <input id="name" type="text" style="width:200px;">
      </div>
      <div class="info-row">
      <label>메뉴:</label>
      <input id="snack" type="text" style="width:200px;">
      </div>
      <div class="info-row"> 
      <label>가격:</label>
      <input id="price" type="text" style="width:200px;">
      </div>
      <div class="info-row">
      <label>별점:</label>
        <div class="info-row">
          <div class="star-rating">
            <button class="star star1">☆</button>
            <button class="star star2">☆</button>
            <button class="star star3">☆</button>
            <button class="star star4">☆</button>
            <button class="star star5">☆</button>
          </div>
        </div>
      </div>
      <div class="info-row textarea-row">
      <label>설명:</label>
      <textarea id="description" style="width:200px;height:50px;"></textarea>
      </div>
      <button class="infoBtn saveBtn" onclick="saveContent('${markerId}')">저장</button>
      </div>`;

    infowindow.setContent(iwContent);
    infowindow.open(map, marker);

    const stars = document.querySelectorAll(".star");
    stars.forEach((star, index) => {
      star.addEventListener("click", () => handleStarClick(index));
    });

    // @@생성된 마커 클릭 시
    kakao.maps.event.addListener(marker, "click", function clickMarker() {
      // map.panTo(marker.getPosition());
      var content = markerData[markerId];
      if (content) {
        var iwContent = `<div class="info-content">
          <div class="info-row">
          <p>카페명:</p>
          ${content.name}
          </div> 
          <div class="info-row">
          <p>메뉴:</p>
          ${content.snack}
          </div>
          <div class="info-row">
          <p>가격:</p>
          ${content.price}
          </div>
          <div class="info-row">
          <p>별점:</p>
          ${content.starGradeData}
          </div>
          <div class="info-row textarea-row">
          <p>설명:</p>
          ${content.description}
          </div>
          <button class="infoBtn modifyBtn" onclick="editContent('${markerId}')">수정</button>" +
          <button class="infoBtn deleteBtn" onclick="deleteContent('${markerId}')">삭제</button>
          </div>`;
        infowindow.setContent(iwContent);
        infowindow.open(map, marker);
      } else {
        infowindow.open(map, marker);
      }
    });

    // 지도 클릭 시 기존 인포윈도우 닫기
    kakao.maps.event.addListener(map, "click", function () {
      infowindow.close();
    });
  });

  // @@마커정보 저장&업데이트
  window.saveContent = function (markerId) {
    var name = document.getElementById("name")?.value;
    var snack = document.getElementById("snack")?.value;
    var price = document.getElementById("price")?.value;
    var starGrade = document.getElementById("starGrade")?.value;
    var description = document.getElementById("description")?.value;

    var latlng = markers
      .find((marker) => marker.id === markerId)
      .marker.getPosition();
    var lat = latlng.getLat();
    var lng = latlng.getLng();

    if (!name && !snack && !price && !starGrade && !description) {
      // 정보가 없으면 마커 삭제
      var markerIndex = markers.findIndex((marker) => marker.id === markerId);
      markers[markerIndex].marker.setMap(null);
      markers.splice(markerIndex, 1);
      delete markerData[markerId];
      localStorage.setItem("markerData", JSON.stringify(markerData));
      infowindow.close();
      return;
    }

    var data = { name, snack, price, starGradeData, description, lat, lng };
    markerData[markerId] = data;
    localStorage.setItem("markerData", JSON.stringify(markerData)); // 로컬 스토리지에 저장

    alert("내용이 저장되었습니다.");

    // 인포윈도우 업데이트
    var iwContent =
      '<div class="info-content">' +
      '<div class="info-row">' +
      "<p>카페명:</p>" +
      data.name +
      "</div>" +
      '<div class="info-row">' +
      "<p>메뉴:</p>" +
      data.snack +
      "</div>" +
      '<div class="info-row">' +
      "<p>가격:</p>" +
      data.price +
      "</div>" +
      '<div class="info-row">' +
      "<p>별점:</p>" +
      data.starGradeData +
      "</div>" +
      '<div class="info-row textarea-row">' +
      "<p>설명:</p>" +
      data.description +
      "</div>" +
      '<button class="infoBtn modifyBtn" onclick="editContent(\'' +
      markerId +
      "')\">수정</button>" +
      '<button class="infoBtn deleteBtn" onclick="deleteContent(\'' +
      markerId +
      "')\">삭제</button>" +
      "</div>";
    console.log(iwContent);
    infowindow.setContent(iwContent);
    infowindow.open(
      map,
      markers.find((marker) => marker.id === markerId).marker
    );
    lastMarker = null;
    
    //새로고침(이대로 써도 될까....????)
    location.href = location.href;
    return data;
  };

  // @@수정
  window.editContent = function (markerId) {
    var content = markerData[markerId];
    console.log(content);
    var iwContent = 
    `<div class="info-content">
      <div class="info-row"> 
      <label>카페명:</label>
      <input id="name" type="text" style="width:200px;" value="${content.name}"> 
      </div>
      <div class="info-row"> 
      <label>메뉴:</label>
      <input id="snack" type="text" style="width:200px;" value="${content.snack}"> 
      </div> 
      <div class="info-row"> 
      <label>가격:</label>
      <input id="price" type="text" style="width:200px;" value="${content.price}"> 
      </div>
      <div class="info-row"> 
      <label>별점:</label>
        <div class="info-row">
          <div class="star-rating">
            <button class="star star1">☆</button>
            <button class="star star2">☆</button>
            <button class="star star3">☆</button>
            <button class="star star4">☆</button>
            <button class="star star5">☆</button>
          </div>
        </div>
      </div>
      <div class="info-row textarea-row"> 
      <label>설명:</label>
      <textarea id="description" style="width:200px;height:50px;">${content.description}</textarea>
      </div>
      <button class="infoBtn saveBtn" onclick="saveContent(${markerId})">저장</button>
      </div>`;
    infowindow.setContent(iwContent);
    const stars = document.querySelectorAll(".star");
    stars.forEach((star, index) => {
      star.addEventListener("click", () => handleStarClick(index));
    });
    infowindow.open(
      map,
      markers.find((marker) => marker.id === markerId).marker
    );
  };

  // @@마커 삭제
  // 삭제 버튼 클릭 시 인포윈도우와 markerData 삭제
  window.deleteContent = function (markerId) {
    var confirmDelete = confirm(
      "장소와 내용이 모두 삭제됩니다. 정말 삭제하시겠습니까?"
    );
    if (confirmDelete) {
      var markerIndex = markers.findIndex((marker) => marker.id === markerId);
      markers[markerIndex].marker.setMap(null); // 마커 제거
      markers.splice(markerIndex, 1); // 마커 배열에서 제거
      delete markerData[markerId]; // 데이터 객체에서 제거
      localStorage.setItem("markerData", JSON.stringify(markerData)); // 로컬 스토리지에서 업데이트
      alert("내용이 삭제되었습니다.");
      infowindow.close();
    } else {
      alert("삭제를 취소하였습니다.");
    }
  };

  // @@ 별점 처리
  function handleStarClick(starIndex) {
    var stars = document.querySelectorAll(".star");
    for (let i = 0; i < stars.length; i++) {
      if (i <= starIndex) {
        stars[i].innerHTML = "★";
      } else {
        stars[i].innerHTML = "☆";
      }
    }
    starGradeData = [starIndex + 1];
    console.log(starGradeData);
    return starGradeData;
  }

  function showStarGrade() {
    if (markerData[markerId].starGradeData == "5") {
    }
  }

  // @@메뉴바 기능
  var menuBarImg = document.querySelector(".menuBarImg");
  var menuBarContainer = document.querySelector(".menuBarContainer");

  // 메뉴바 안보이게 보이게
  function toggleMenu() {
    const menuBar = document.getElementById("menuBar");
    if (menuBar.style.display == "none") {
      menuBar.style.display = "block";
    } else {
      menuBar.style.display = "none";
    }
  }

  // 메뉴바 클릭 이벤트
  document.querySelector(".menuBarImg").addEventListener("click", toggleMenu);

  // 메뉴바 p태그 클릭 이벤트
  document
    .querySelector(".p-searchMemo")
    .addEventListener("click", openSearchPage);
  document
    .querySelector(".p-userGuide")
    .addEventListener("click", openUserGuidePage);

  // 돌아가기 버튼 클릭 이벤트
  document.querySelector(".backBtn").addEventListener("click", function () {
    location.href = location.href;
  });
  document.querySelector("#backBtn2").addEventListener("click", function () {
    location.href = location.href;
  });

  // @@ 검색 메모 메뉴 함수
  function openSearchPage() {
    let mapEl = document.querySelector(".mapEl");
    mapContainer2.style.display = "block";
    mapContainer3.style.display = "none";
    mapEl.style.display = "none";
    menuBar.style.display = "none";

    const tbody = document.querySelector("#memoSearchTable tbody");
    tbody.innerHTML = ""; // 기존 내용 지우기

    Object.keys(markerData).forEach((markerId) => {
      const data = markerData[markerId];
      const newRow = tbody.insertRow();
      const cafeCell = newRow.insertCell(0);
      const snackCell = newRow.insertCell(1);
      const priceCell = newRow.insertCell(2);
      const scoreCell = newRow.insertCell(3);
      const descriptionCell = newRow.insertCell(4);

      cafeCell.innerHTML = data.name;
      snackCell.innerHTML = data.snack;
      priceCell.innerHTML = data.price;
      scoreCell.innerHTML = data.starGradeData;
      descriptionCell.innerHTML = data.description;

      document
        .querySelector("#memoSearchBtn")
        .addEventListener("click", memoSearching);
      return { cafeCell, snackCell, priceCell, scoreCell, descriptionCell };
    });
  }

  // @@사용가이드 팝업 함수
  function openUserGuidePage() {
    let mapEl = document.querySelector(".mapEl");
    mapContainer3.style.display = "block";
    mapContainer2.style.display = "none";
    mapEl.style.display = "none";
    menuBar.style.display = "none";
  }

  //@@메모 검색
  function memoSearching() {
    const keyword = document
      .querySelector("#memoSearchBar")
      .value.toLowerCase();
    const filteredData = Object.values(markerData).filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.snack.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword)
    );

    const tbody = document.querySelector("#memoSearchTable tbody");
    tbody.innerHTML = ""; // 기존 내용 지우기

    filteredData.forEach((item) => {
      const newRow = tbody.insertRow();
      const cafeCell = newRow.insertCell(0);
      const snackCell = newRow.insertCell(1);
      const priceCell = newRow.insertCell(2);
      const scoreCell = newRow.insertCell(3);
      const descriptionCell = newRow.insertCell(4);

      cafeCell.innerHTML = highlightKeyword(item.name || "", keyword);
      snackCell.innerHTML = highlightKeyword(item.snack || "", keyword);
      priceCell.innerHTML = highlightKeyword(item.price || "", keyword);
      scoreCell.innerHTML = highlightKeyword(
        Array.isArray(item.starGradeData)
          ? item.starGradeData.join(", ")
          : item.starGradeData || "",
        keyword
      );
      descriptionCell.innerHTML = highlightKeyword(
        item.description || "",
        keyword
      );
    });

    //검색 해제
    document
      .querySelector("#memoSearchOffBtn")
      .addEventListener("click", () => {
        openSearchPage();
      });
  }

  function highlightKeyword(text, keyword) {
    if (typeof text !== "string") {
      return text;
    }
    const regex = new RegExp(`(${keyword})`, "gi");
    return text.replace(regex, '<span class="highlight">$1</span>');
  }

  // @@마커 모두 삭제
  document
    .querySelector("#clearBtn")
    .addEventListener("click", clearAllMarkers);

  function clearAllMarkers() {
    // 모든 마커 제거
    markers.forEach(function (markerObj) {
      markerObj.marker.setMap(null); // 마커를 지도에서 제거
    });
    // markers배열,markerData객체 비우기
    markers.length = 0;
    markerData = {};
    // 로컬 스토리지에서 데이터 제거
    localStorage.removeItem("markerData");
    alert("모든 마커가 삭제되었습니다.");
  }
});
