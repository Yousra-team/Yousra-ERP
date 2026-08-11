frappe.after_ajax(() => {
    const relabelSidebar = () => {
        document.querySelectorAll('.sidebar-item-label.header-subtitle')
            .forEach(el => {
                if (el.textContent.trim() === 'ERPNext') {
                    el.textContent = 'Yousra ERP';
                }
            });
    };

    relabelSidebar();

    // The sidebar re-renders every time you switch modules/workspaces,
    // so we watch the page for changes and re-apply the label each time.
    const observer = new MutationObserver(relabelSidebar);
    observer.observe(document.body, { childList: true, subtree: true });
});

/// Franck Modifications version 1.0.0 August 2026 below : 

frappe.provide("yousra_erp.POS");

(function extend_item_selector() {
	if (!(window.erpnext && erpnext.PointOfSale && erpnext.PointOfSale.ItemSelector)) {
		setTimeout(extend_item_selector, 200);
		return;
	}

	const ItemSelector = erpnext.PointOfSale.ItemSelector;

	// --- 1. Rebuild the DOM: hide the old dropdown, add stacked tile rows ---
	ItemSelector.prototype.prepare_dom = function () {
		this.wrapper.append(
			`<section class="items-selector">
				<div class="filter-section">
					<div class="label">${__("All Items")}</div>
					<div class="search-field"></div>
					<div class="item-group-field" style="display:none;"></div>
				</div>
				<div class="group-levels-container"></div>
				<div class="items-container"></div>
			</section>`
		);

		this.$component = this.wrapper.find(".items-selector");
		this.$items_container = this.$component.find(".items-container");
		this.$group_levels_container = this.$component.find(".group-levels-container");
		this.$filter_label = this.$component.find(".label");

		this.$items_container.addClass(this.item_display_class).hide();
		this.levels = []; // [{ parent, groups: [...names], selected: name|null }, ...]
	};

	// --- 2. On load, fetch the root level and render ---
	ItemSelector.prototype.load_items_data = async function () {
		await this.item_ready_group;
		if (!this.price_list) {
			const res = await frappe.db.get_value("POS Profile", this.pos_profile, "selling_price_list");
			this.price_list = res.message.selling_price_list;
		}
		this.levels = [];
		await this.load_level(this.parent_item_group);
		this.render_levels();
	};

	// --- 3. Fetch the child groups of a given parent, push as a new level ---
	ItemSelector.prototype.load_level = async function (parent_group) {
		this.start_item_loading_animation();
		const r = await frappe.db.get_list("Item Group", {
			filters: { parent_item_group: parent_group },
			fields: ["name"],
			order_by: "name asc",
			limit: 0,
		});
		this.stop_item_loading_animation();
		this.levels.push({ parent: parent_group, groups: r.map((g) => g.name), selected: null });
	};

	// --- 4. Handle a tile click at a given level ---
	ItemSelector.prototype.select_group_at_level = async function (level_index, group_name) {
		// Drop any deeper levels that existed from a previous path
		this.levels = this.levels.slice(0, level_index + 1);
		this.levels[level_index].selected = group_name;

		this.start_item_loading_animation();
		const children = await frappe.db.get_list("Item Group", {
			filters: { parent_item_group: group_name },
			fields: ["name"],
			order_by: "name asc",
			limit: 0,
		});
		this.stop_item_loading_animation();

		if (children.length) {
			// Has sub-groups: add a new row below, don't show items yet
			this.levels.push({ parent: group_name, groups: children.map((g) => g.name), selected: null });
			this.item_group = null;
			this.$items_container.hide();
		} else {
			// Leaf group: show its items below all the tile rows
			this.item_group = group_name;
			this.$items_container.show();
			this.filter_items();
		}

		this.set_item_selector_filter_label(group_name);
		this.render_levels();
	};

	// --- 5. Render every level as its own row, all visible at once ---
	ItemSelector.prototype.render_levels = function () {
		this.$group_levels_container.html("");

		this.levels.forEach((level, idx) => {
			if (!level.groups.length) return;

			const $row = $(`<div class="group-tile-row"></div>`);
			level.groups.forEach((g) => {
				const is_selected = g === level.selected;
				$row.append(
					`<div class="group-tile${is_selected ? " group-tile-selected" : ""}"
						data-level="${idx}" data-group="${frappe.utils.escape_html(g)}">
						${frappe.utils.escape_html(__(g))}
					</div>`
				);
			});
			this.$group_levels_container.append($row);
		});

		this.$group_levels_container.show();
	};

	// --- 6. Reset to root when the "All Items" label is clicked ---
	ItemSelector.prototype.reset_group_navigation = function () {
		this.item_group = this.parent_item_group;
		this.levels = this.levels.slice(0, 1);
		this.levels[0].selected = null;
		this.$items_container.hide();
		this.set_item_selector_filter_label("");
		this.render_levels();
	};

	// --- 7. Bind clicks on tiles + the reset label, keep original bindings ---
	const _bind_events = ItemSelector.prototype.bind_events;
	ItemSelector.prototype.bind_events = function () {
		_bind_events.call(this);

		this.$component.on("click", ".group-tile", (e) => {
			const $t = $(e.currentTarget);
			const level = parseInt($t.attr("data-level"), 10);
			const group = $t.attr("data-group");
			this.select_group_at_level(level, group);
		});

		this.$component.on("click", ".label", () => this.reset_group_navigation());
	};

	// --- 8. While searching, hide the tile rows and search across all items ---
	const _filter_items = ItemSelector.prototype.filter_items;
	ItemSelector.prototype.filter_items = function ({ search_term = "" } = {}) {
		if (search_term) {
			this.$group_levels_container.hide();
			this.$items_container.show();
		} else if (this.levels && this.levels.length) {
			this.$group_levels_container.show();
		}
		return _filter_items.call(this, { search_term });
	};
})();