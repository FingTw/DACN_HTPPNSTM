document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (!searchInput || !searchResults) {
        console.error('Không tìm thấy #searchInput hoặc #searchResults trong DOM');
        return;
    }

    let selectedIndex = -1;

    searchInput.addEventListener('input', async function () {
        const query = searchInput.value.trim();
        if (query.length < 1) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            selectedIndex = -1;
            return;
        }

        try {
            const response = await fetch(`/Home/Search?query=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const products = await response.json();

            searchResults.innerHTML = '';
            selectedIndex = -1;

            if (!products || products.length === 0) {
                const item = document.createElement('li');
                item.classList.add('list-group-item');
                item.textContent = 'Không tìm thấy kết quả';
                searchResults.appendChild(item);
            } else {
                products.forEach((product, index) => {
                    const item = document.createElement('li');
                    item.classList.add('list-group-item', 'd-flex', 'align-items-center');

                    // Lấy hình ảnh đầu tiên nếu có
                    let imageUrl = '/images/placeholder.jpg';
                    if (product.hinhanhs && product.hinhanhs.length > 0 && product.hinhanhs[0].url) {
                        imageUrl = product.hinhanhs[0].url;
                    }

                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = product.tensp || 'Product';
                    img.style.width = '40px';
                    img.style.height = '40px';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '4px';
                    img.classList.add('me-3');

                    const text = document.createElement('span');
                    text.textContent = product.tensp || 'Unknown Product';

                    item.appendChild(img);
                    item.appendChild(text);

                    item.dataset.index = index;

                    item.addEventListener('click', function () {
                        searchInput.value = product.tensp;
                        searchResults.style.display = 'none';
                        window.location.href = `/Product/Details/${product.masp}`;
                    });

                    searchResults.appendChild(item);
                });
            }
            searchResults.style.display = 'block';
        } catch (error) {
            console.error('Lỗi khi fetch dữ liệu:', error);
            searchResults.innerHTML = '<li class="list-group-item">Đã có lỗi xảy ra</li>';
            searchResults.style.display = 'block';
        }
    });

    searchInput.addEventListener('keydown', function (event) {
        const items = searchResults.querySelectorAll('.list-group-item');
        if (items.length === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (selectedIndex < items.length - 1) {
                selectedIndex++;
                updateSelection(items);
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (selectedIndex > 0) {
                selectedIndex--;
                updateSelection(items);
            }
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < items.length) {
                items[selectedIndex].click();
            }
        } else if (event.key === 'Tab') {
            event.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < items.length) {
                items[selectedIndex].click();
            }
        } else if (event.key === 'Escape') {
            searchResults.style.display = 'none';
            selectedIndex = -1;
        }
    });

    function updateSelection(items) {
        items.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    }

    document.addEventListener('click', function (event) {
        if (!searchInput.contains(event.target) && !searchResults.contains(event.target)) {
            searchResults.style.display = 'none';
            selectedIndex = -1;
        }
    });
});
