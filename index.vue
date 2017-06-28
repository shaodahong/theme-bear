<template>
	<div>
		<div class="banxin article-list">
			<ul>
				<li v-if="lists" v-for="list in lists" class="article-list">
					<h3 class="article-title" v-on:click="jumpArticle(list.id)" v-text="list.title"></h3>
					<p class="article-date" v-text="list.dateline"></p>
					<p class="article-des" v-text="list.description"></p>
				</li>
			</ul>
		</div>
		<loading v-if="loading"></loading>
	</div>

</template>

<script>
	import loading from '../common/loading/loading';
	export default {
	name: 'articleList',
		data () {
			return {
				lists: null,
				loading: true
			}
		},
		created: function () {
			this.getLists();
		},
		mounted: function () {
			console.log(this.$router.currentRoute)
		},
		components: {
			loading
		},
		methods: {
				getLists: function() {
					var _self = this;
					this.$http.get('/auth/article/all').then((res) => {
						_.forEach(res.data, (val) => {
							val.dateline = _self.Util.format(new Date(val.dateline*1000), 'yyyy-MM-dd hh:mm:ss');
						})
						this.lists = res.data;
						this.loading = false;
					})
				},
				jumpArticle: function (id) {
					this.$router.push({
						name: 'article',
						params: {
							id: id
						}
					});
				}
		}
	}
</script>

<style lang="stylus" scoped>
	@import "./article-list.styl"
</style>
