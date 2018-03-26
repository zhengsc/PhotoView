
(function(win, undefined) {
	var e = function(selector) {
		return document.querySelector(selector)
	}

	var el = function(selector) {
		return document.querySelectorAll(selector)
	}

	var RAF = (function() {
		return win.requestAnimationFrame || win.webkitRequestAnimationFrame || function(fn) {
				setTimeout(fn, 1000 / 60)
			}
	})()

	var cE = function(element, attrs) {
		var el = document.createElement(element)

		if(typeof attrs === 'object') {
			for(var i in attrs) {
				if(attrs.hasOwnProperty(i)) {
					el.setAttribute(i, attrs[i])
				}
			}
		}

		return el
	}

	var on = function(element, type, fn) {
		element.addEventListener(type, fn)
	}

	Element.prototype.remove = function(type, fn) {
		this.removeEventListener(type, fn)
	}

	Element.prototype.setStyle = function(style) {
		for(var j in style) {
			if(style.hasOwnProperty(j)) {
				this.style[j] = style[j]
			}
		}

		return this
	}

	Element.prototype.html = function(html) {
		this.innerHTML = html

		return this
	}

	Function.prototype.bind = Function.prototype.bind || function(self) {
		var _this = this
		var args = Array.prototype.slice.call(arguments, 1)

		return function() {
			_this.apply(self, args.concat(Array.prototype.slice.call(arguments)))
		}
	}

	var PreviewPhoto = function() {
		this.imgList = null // 图片列表
		this.length = 0 // 图片列表长度
		this.curIndex = 0 // 当前显示图片的index
		this.changeDistance = 60 // 切换图片的距离
		this.marginDistance = 20 // 图片之间的间隔
		this.stateLock = false // 状态锁
		this.transiting = false // 正在执行动画
		this.isMove = false // 是否触发touchmove
		this.winWidth = window.innerWidth
	}

	PreviewPhoto.prototype = {
		constructor: PreviewPhoto,

		touchStart: function(event) {
			var touches = event.changedTouches[0]

			this.startPos = {
				x: touches.pageX,
				y: touches.pageY
			}

			this.isMove = false
		},

		touchMove: function(event) {
			if(this.transiting) return 
			// TODO 未处理快速点击时，依然添加了transition过度效果
			var touches = event.changedTouches[0]
			var _this = this

			RAF(function() {
				var dis = _this.isSildeHor(touches) / 2
				
				if(dis) {
					dis = dis - _this.curIndex * (_this.winWidth + _this.marginDistance)

					_this.container.setStyle({
						transform: 'translate('+ dis +'px, 0px)',
						webkitTransform: 'translate('+ dis +'px, 0px)'
					})
				}
			})

			this.isMove = true

			event.preventDefault()
			event.stopPropagation()
		},

		touchEnd: function(event) {
			if(!this.isMove) return 

			var touches = event.changedTouches[0]
			var _this = this
			var index = _this.curIndex
			var distanceOfHor = this.getDistanceOfHor(touches)

			if(Math.abs(distanceOfHor) >= _this.changeDistance) {
				if(index <= _this.length - 1 && index >= 0) {
					// 切换图片
					if(distanceOfHor < 0 && index !== _this.length - 1) {
						_this.curIndex++
						this.stateLock = true
					} else if(distanceOfHor > 0 && index !== 0) {
						_this.curIndex--
						this.stateLock = true
					}
				}
			}

			this.go(_this.curIndex + 1)
		},

		orientationchange: function() {
			var _this = this

			setTimeout(_this.resize.bind(_this), 200)
		},

		/*
		 * 跳转到第几张图片
		 * @param {Number} index 图片的序号，从1计数
		 * @param {Boolean} isRemoveTransition 是否关闭动画效果
		 */
		go: function(index, isRemoveTransition) {
			var len = this.length

			if(index > len || index < 1) {
				throw new Error('可输入范围：1 ~ '+ len)
			}

			var translate = (index - 1) * (this.winWidth + this.marginDistance) * -1

			this.container.setStyle({
				transition: !isRemoveTransition ? 'transform .4s' : null,
				webkitTransition: !isRemoveTransition ? '-webkit-transform .4s' : null,
				transform: 'translate('+ translate +'px, 0px)',
				webkitTransform: 'translate('+ translate +'px, 0px)'
			})

			!isRemoveTransition && (this.transiting = true)
		},

		// loadImg: function(index) {
		// 	var img = el('img.photo-img')[index]
		// 	var dataSrc = img.dataset.src
		// 	if(dataSrc) {
		// 		img.setAttribute('src', dataSrc)
		// 		img.removeAttribute('data-src')
		// 	}
		// },

		// getCurImgSibling: function() {
		// 	var index = this.curIndex
		// 	var len = this.length

		// 	if(index + 1 < len) {
		// 		this.loadImg(index + 1)
		// 	}
			
		// 	if(index - 1 >= 0) {
		// 		this.loadImg(index - 1)
		// 	}
		// },

		/* 
		 * 获取水平上的移动距离
		 * @param {Object} pos touchend时的位置信息
		 */ 
		getDistanceOfHor: function(pos) {
			return pos.pageX - this.startPos.x
		},

		/* 
		 * 是否在水平方向上的移动
		 * @param {Object} pos touchend时的位置信息
		 */ 
		isSildeHor: function(pos) {
			var sp = this.startPos
			var distanceOfHor = this.getDistanceOfHor(pos)

			if(Math.abs(distanceOfHor) > Math.abs(pos.pageY - sp.y)) {
				return distanceOfHor
			} else {
				return false
			}
		},

		/* 
		 * 重新设置尺寸
		 */
		resize: function() {
			var list = this.container.querySelectorAll('li')

			this.winWidth = win.innerWidth

			this.container.setStyle({
				width: this.length * this.winWidth + (this.length - 1) * this.marginDistance + 'px'
			})

			for(var i = 0; i < list.length; i++) {
				list[i].setStyle({
					width: this.winWidth + 'px'
				})
			}

			this.go(this.curIndex + 1, true)
		},

		/* 
		 * 创建DOM结构
		 */
		render: function() {
			var translate = this.curIndex * (this.winWidth + this.marginDistance) * -1

			this.wrapper = cE('div', {
				class: 'PreviewPhoto'
			})

			this.container = cE('ul', {
				class: 'PreviewPhoto-container'
			})

			this.container.setStyle({
				width: this.length * this.winWidth + (this.length - 1) * this.marginDistance + 'px',
				// transform: 'translate('+ translate +'px, 0px)',
				// webkitTransform: 'translate('+ translate +'px, 0px)'
			})

			var liHtml = null
			var list = this.imgList

			for(var i = 0; i < list.length; i++) {
				var src = this.isImgSrc ? list[i] : list[i].getAttribute('src')

				liHtml = cE('li').setStyle({
					width: this.winWidth + 'px',
					marginRight: (i !== this.length - 1 ? this.marginDistance : 0) + 'px'
				}).html('<img class="photo-img" src="'+ src +'" />')

				this.container.appendChild(liHtml)
			}

			this.wrapper.appendChild(this.container)

			document.body.appendChild(this.wrapper)
		},

		/* 
		 * 显示图片预览
		 * @param {Number} index 需要显示的图片序号，从1开始计数
		 */
		show: function(index) {
			var _this = this

			if(typeof index === 'number') {
				this.curIndex = index - 1
				this.go(index, true)
			}

			this.wrapper.setStyle({
				display: 'block'
			})

			setTimeout(function() {
				_this.wrapper.classList.add('show')
			})
		},

		/* 
		 * 关闭图片预览
		 */
		hide: function() {
			var _this = this

			var fn = function() {
				_this.wrapper.setStyle({
					display: 'none'
				})

				_this.wrapper.remove('transitionend', fn)
			}

			this.wrapper.classList.remove('show')

			on(this.wrapper, 'transitionend', fn)

			on(this.wrapper, 'webkitTransitionend', fn)

			this.transiting = false
		},

		/*
		 * 清除动画style，同时解除状态锁
		*/
		clearTransition: function() {
			this.container.setStyle({
				transition: null,
				webkitTransition: null
			})

			if(typeof this.callback === 'function' && this.stateLock) {
				this.callback.call(this.imgList[this.curIndex], this.curIndex + 1, this.length)
			}

			this.stateLock = this.transiting = false
		},

		bind: function() {
			var _this = this

			on(this.container, 'touchstart', this.touchStart.bind(this))

			on(this.container, 'touchmove', this.touchMove.bind(this))

			on(this.container, 'touchend', this.touchEnd.bind(this))

			on(this.container, 'touchcancel', this.touchEnd.bind(this))

			on(this.container, 'transitionend', this.clearTransition.bind(this))

			on(this.container, 'webkitTransitionend', this.clearTransition.bind(this))

			on(this.wrapper, 'click', this.hide.bind(this))

			on(win, 'orientationchange', this.orientationchange.bind(this))

			this.showBtns.forEach(function(ele, i) {
				on(ele, 'click', _this.show.bind(_this, i + 1))
			})
		},

		/* 
		 * 初始化函数
		 * @param {Object} options 配置项
		 * @param {String} selector 打开浏览器的DOM选择符
		 * @param {String|Array} images 图片资源，若为String则代表图片的选择符，若为Array，则为图片路径
		 * @param {Number} index 初始化时，默认显示的图片的序号
		 * @param {Function} callback 切换图片之后执行的回调，this指向当前显示的图片
		 */
		init: function(options) {
			if(!options && typeof options !== 'object') {
				throw new Error('请传递配置项')
			}

			if(!options.selector) {
				throw new Error('selector不能为空')
			}

			var images = options.images

			this.showBtns = el(options.selector)

			if(typeof images === 'string') {
				this.imgList = Array.prototype.slice.call(el(images))
			} else {
				this.imgList =  images
				this.isImgSrc = true
			}
			
			this.length = this.imgList.length

			if(this.length < 1) {
				throw new Error('没有选取到图片资源')
			}

			if(options.index >= 0) {
				// 取最小值，防止传递的options.index超出最大长度
				this.curIndex = Math.min(options.index - 1, this.length - 1)
			}

			if(options.callback) {
				this.callback = options.callback
			}

			this.render()

			this.bind()
		}
	}

	win['PreviewPhoto'] = PreviewPhoto
})(window)
