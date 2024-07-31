document.addEventListener("DOMContentLoaded", function () {
  var mapContainer = document.getElementById("map"),
    mapOption = {
      center: new kakao.maps.LatLng(33.450701, 126.570667),
      level: 3,
    };

  var map = new kakao.maps.Map(mapContainer, mapOption);
  var ps = new kakao.maps.services.Places();
  var infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });

  // 마커와 인포윈도우를 관리할 배열
  var markers = [];
  var markerData = {};

  // 마지막으로 생성된 마커 추적
  var lastMarker = null;

  // // 고유 ID 생성기
  function generateUniqueId() {
    return "_" + Math.random().toString(36).substr(2, 9);
  }

  // 키워드로 장소를 검색합니다
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

  // 지도를 클릭한 위치에 마커를 추가, 인포윈도우를 표시
  kakao.maps.event.addListener(map, "click", function (mouseEvent) {
    // 이전에 생성된 마커가 있고 아무 글자도 입력되지 않았으면 삭제
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

    var iwContent =
      '<div class="info-content">' +
      '<div class="info-row">' +
      "<label>카페명:</label>" +
      '<input id="name" type="text" style="width:200px;">' +
      "</div>" +
      '<div class="info-row">' +
      "<label>먹은 것:</label>" +
      '<input id="snack" type="text" style="width:200px;">' +
      "</div>" +
      '<div class="info-row">' +
      "<label>가격:</label>" +
      '<input id="price" type="text" style="width:200px;">' +
      "</div>" +
      '<div class="info-row">' +
      "<label>별점:</label>" +
      '<input id="starGrade" type="text" style="width:200px;">' +
      "</div>" +
      '<div class="info-row textarea-row">' +
      "<label>설명:</label>" +
      '<textarea id="description" style="width:200px;height:100px;"></textarea>' +
      "</div>" +
      '<button class="saveBtn" onclick="saveContent(\'' +
      markerId +
      "')\">저장</button>" +
      '<button class="cancelBtn" onclick="cancelEdit()">취소</button>' +
      "</div>";

    infowindow.setContent(iwContent);
    infowindow.open(map, marker);

    kakao.maps.event.addListener(marker, "click", function clickMarker() {
      var content = markerData[markerId];
      if (content) {
        var iwContent =
          '<div class="info-content">' +
          "<p>카페명: " +
          content.name +
          "</p>" +
          "<p>먹은 것: " +
          content.snack +
          "</p>" +
          "<p>가격: " +
          content.price +
          "</p>" +
          "<p>별점: " +
          content.starGrade +
          "</p>" +
          "<p>설명: " +
          content.description +
          "</p>" +
          '<button class="modifyBtn" onclick="editContent(\'' +
          markerId +
          "')\">수정</button>" +
          '<button class="deleteBtn" onclick="deleteContent(\'' +
          markerId +
          "')\">삭제</button>" +
          "</div>";
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

  // 저장 버튼 클릭 시 인포윈도우 내용을 저장하는 함수
  window.saveContent = function (markerId) {
    var name = document.getElementById("name")?.value;
    var snack = document.getElementById("snack")?.value;
    var price = document.getElementById("price")?.value;
    var starGrade = document.getElementById("starGrade")?.value;
    var description = document.getElementById("description")?.value;

    if (!name && !snack && !price && !starGrade && !description) {
      var markerIndex = markers.findIndex((marker) => marker.id === markerId);
      markers[markerIndex].marker.setMap(null); // 아무것도 입력하지 않으면 마커 삭제
      markers.splice(markerIndex, 1); // 마커 배열에서 제거
      delete markerData[markerId]; // 데이터 객체에서 제거
      infowindow.close();
      return;
    }

    var data = { name, snack, price, starGrade, description };
    markerData[markerId] = data;

    alert("내용이 저장되었습니다.");
    infowindow.close();
    lastMarker = null; // 저장되면 lastMarker 초기화
  };

  // 수정 버튼 클릭 시 textarea로 전환
  window.editContent = function (markerId) {
    var content = markerData[markerId];
    var iwContent =
      '<div class="info-content">' +
      '<div class="info-row">' +
      "<label>카페명:</label>" +
      '<input id="name" type="text" style="width:200px;" value="' +
      content.name +
      '">' +
      "</div>" +
      '<div class="info-row">' +
      "<label>먹은 것:</label>" +
      '<input id="snack" type="text" style="width:200px;" value="' +
      content.snack +
      '">' +
      "</div>" +
      '<div class="info-row">' +
      "<label>가격:</label>" +
      '<input id="price" type="text" style="width:200px;" value="' +
      content.price +
      '">' +
      "</div>" +
      '<div class="info-row">' +
      "<label>별점:</label>" +
      '<input id="starGrade" type="text" style="width:200px;" value="' +
      content.starGrade +
      '">' +
      "</div>" +
      '<div class="info-row textarea-row">' +
      "<label>설명:</label>" +
      '<textarea id="description" style="width:200px;height:100px;">' +
      content.description +
      "</textarea>" +
      "</div>" +
      '<button class="saveBtn" onclick="saveContent(\'' +
      markerId +
      "')\">저장</button>" +
      '<button class="cancelBtn" onclick="cancelEdit()">취소</button>' +
      "</div>";
    infowindow.setContent(iwContent);
    infowindow.open(
      map,
      markers.find((marker) => marker.id === markerId).marker
    );
  };

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
      alert("내용이 삭제되었습니다.");
      infowindow.close();
    } else {
      alert("삭제를 취소하였습니다.");
    }
  };

  // 취소 버튼 클릭시 인포윈도우 닫기
  window.cancelEdit = function () {
    infowindow.close();
  };
});

var menuBarImg = document.querySelector(".menuBarImg");
var menuBarContainer = document.querySelector(".menuBarContainer");

menuBarImg.addEventListener("click", function () {
  menuBarContainer.innerHTML = ""; // menuBarContainer 초기화
  var menuBar = document.createElement("div");
  menuBar.className = "menuBar";

  var menuItemsContainer = `
    <div class="menuItemsContainer">
      <p class="menuItem p-searchMemo">Search Memo</p>
      <p class="menuItem p-userGuide">User Guide</p>
      <p class="menuItem p-letter">Letter</p>
      <p class="menuItem p-QNA">Q&A</p>
      <p class="menuItem p-backBtn">돌아가기</p>
    </div>
  `;

  menuBar.innerHTML = menuItemsContainer;

  menuBarContainer.appendChild(menuBar);

  // 메뉴바를 표시
  menuBarContainer.style.display = "block";

  // 돌아아기 클릭시 메뉴바 들어감
  document.querySelector(".p-backBtn").addEventListener("click", function () {
    menuBarContainer.style.display = "none";
  });
});
